"""
排坑服务 - 后端排坑逻辑

将排坑逻辑从前端迁移到后端，每次报名/规则变更时自动计算并存储排坑结果。

核心设计：
1. 报名顺序是第一约束（不允许挤占式分配）
2. 坑位规则是第二约束
3. 使用队列保证单线程处理，避免并发问题
"""
import asyncio
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm.attributes import flag_modified

from app.models.team import Team
from app.models.signup import Signup
from app.core.logging import get_logger

logger = get_logger(__name__)


@dataclass
class SlotAssignment:
    """坑位分配"""
    signup_id: Optional[int]
    locked: bool


@dataclass
class AllocationResult:
    """分配结果"""
    slot_assignments: List[Dict[str, Any]]  # [{signup_id, locked}, ...]
    waitlist: List[int]  # [signup_id, ...]
    signup_results: Dict[int, Tuple[str, Optional[int]]]  # {signup_id: (status, slot_index)}


class SlotAllocationService:
    """
    排坑服务
    
    负责：
    1. 计算排坑结果（二分图匹配）
    2. 存储排坑结果到团队表
    3. 提供分配结果查询
    """
    
    # 全局队列，确保同一团队的排坑操作串行执行
    _team_locks: Dict[int, asyncio.Lock] = {}
    
    @classmethod
    def _get_team_lock(cls, team_id: int) -> asyncio.Lock:
        """获取团队锁，确保同一团队的排坑操作串行执行"""
        if team_id not in cls._team_locks:
            cls._team_locks[team_id] = asyncio.Lock()
        return cls._team_locks[team_id]
    
    @classmethod
    async def reallocate(
        cls,
        db: AsyncSession,
        team_id: int,
        new_signup_id: Optional[int] = None
    ) -> AllocationResult:
        """
        重新计算排坑结果
        
        Args:
            db: 数据库会话
            team_id: 团队ID
            new_signup_id: 新报名ID（用于返回该报名的分配结果）
        
        Returns:
            AllocationResult: 分配结果
        """
        lock = cls._get_team_lock(team_id)
        async with lock:
            return await cls._do_reallocate(db, team_id, new_signup_id)
    
    @classmethod
    async def _do_reallocate(
        cls,
        db: AsyncSession,
        team_id: int,
        new_signup_id: Optional[int] = None
    ) -> AllocationResult:
        """实际执行排坑计算"""
        # 获取团队信息
        team_result = await db.execute(
            select(Team).where(Team.id == team_id)
        )
        team = team_result.scalar_one_or_none()
        if not team:
            logger.error(f"团队不存在: {team_id}")
            return AllocationResult([], [], {})
        
        # 获取所有有效报名（按创建时间排序）
        signups_result = await db.execute(
            select(Signup).where(
                Signup.team_id == team_id,
                Signup.cancelled_at.is_(None)
            ).order_by(Signup.created_at.asc())
        )
        signups = list(signups_result.scalars().all())
        
        # 获取规则和当前分配
        rules = team.rule or []
        max_slots = team.max_members or 25
        current_assignments = team.slot_assignments or []
        
        # 确保规则和分配数组长度正确
        rules = cls._normalize_rules(rules, max_slots)
        
        # 执行排坑算法
        result = cls._allocate(rules, signups, current_assignments, max_slots)
        
        # 更新团队的排坑结果
        team.slot_assignments = result.slot_assignments
        team.waitlist = result.waitlist
        # 标记 JSON 字段已修改
        flag_modified(team, "slot_assignments")
        flag_modified(team, "waitlist")
        
        await db.flush()
        
        logger.info(f"团队 {team_id} 排坑完成: 已分配 {sum(1 for s in result.slot_assignments if s['signup_id'])} 人, 候补 {len(result.waitlist)} 人")
        
        return result
    
    @classmethod
    def _normalize_rules(cls, rules: List[Dict], max_slots: int) -> List[Dict]:
        """规范化规则数组"""
        default_rule = {"allowRich": False, "allowXinfaList": []}
        result = []
        for i in range(max_slots):
            if i < len(rules) and rules[i]:
                result.append({
                    "allowRich": rules[i].get("allowRich", False),
                    "allowXinfaList": rules[i].get("allowXinfaList", [])
                })
            else:
                result.append(default_rule.copy())
        return result
    
    @classmethod
    def _allocate(
        cls,
        rules: List[Dict],
        signups: List[Signup],
        current_assignments: List[Dict],
        max_slots: int
    ) -> AllocationResult:
        """
        执行排坑算法

        约束：
        1. 第一约束：保留所有现有分配（包括连连看手动交换的结果）
        2. 第二约束：报名顺序优先，不允许挤占
        3. 第三约束：坑位规则匹配

        策略：
        1. 保留所有现有的分配（不管是否 locked），只要报名仍然有效
        2. 只对新报名进行分配
        3. 新报名优先找空位中符合规则的
        4. 如果没有符合规则的空位，尝试换位策略（只能换未锁定的坑位）
        5. 无法安排的加入候补
        """
        # 构建报名ID到报名对象的映射
        signup_map = {s.id: s for s in signups}
        signup_ids = set(s.id for s in signups)

        # 初始化分配数组，并保留所有现有的有效分配
        assignments: List[Dict[str, Any]] = [
            {"signup_id": None, "locked": False}
            for _ in range(max_slots)
        ]

        # 保留所有现有的分配（不管是否 locked），只要报名仍然有效
        for i, assignment in enumerate(current_assignments):
            if i >= max_slots:
                break
            if assignment and assignment.get("signup_id"):
                signup_id = assignment["signup_id"]
                if signup_id in signup_ids:
                    # 保留现有分配（包括连连看交换的结果）
                    assignments[i] = {
                        "signup_id": signup_id,
                        "locked": assignment.get("locked", False)
                    }

        # 找出已分配的报名ID
        assigned_signup_ids = set(
            a["signup_id"] for a in assignments if a["signup_id"]
        )

        # 按报名顺序处理新报名（未在现有分配中的报名）
        new_signups = [s for s in signups if s.id not in assigned_signup_ids]
        waitlist: List[int] = []
        signup_results: Dict[int, Tuple[str, Optional[int]]] = {}

        # 记录已分配的报名结果
        for i, a in enumerate(assignments):
            if a["signup_id"]:
                signup_results[a["signup_id"]] = ("allocated", i)

        # 只对新报名进行分配
        for signup in new_signups:
            slot_index = cls._find_slot_for_signup(assignments, rules, signup, signup_map)

            if slot_index is not None:
                assignments[slot_index] = {
                    "signup_id": signup.id,
                    "locked": False
                }
                signup_results[signup.id] = ("allocated", slot_index)
            else:
                # 无法分配，加入候补
                waitlist.append(signup.id)
                signup_results[signup.id] = ("waitlist", len(waitlist) - 1)

        return AllocationResult(
            slot_assignments=assignments,
            waitlist=waitlist,
            signup_results=signup_results
        )
    
    @classmethod
    def _find_slot_for_signup(
        cls,
        assignments: List[Dict],
        rules: List[Dict],
        signup: Signup,
        signup_map: Dict[int, Signup]
    ) -> Optional[int]:
        """
        为报名找到合适的坑位
        
        策略：
        1. 优先找空位中符合规则的
        2. 如果没有符合规则的空位，尝试换位策略
        """
        # 获取报名信息
        xinfa = cls._get_signup_xinfa(signup)
        is_rich = signup.is_rich
        
        # 找出所有空位
        empty_slots = [
            i for i, a in enumerate(assignments)
            if a["signup_id"] is None
        ]
        
        # 在空位中找符合规则的
        for slot_index in empty_slots:
            if cls._fits_rule(rules[slot_index], xinfa, is_rich):
                return slot_index
        
        # 没有符合规则的空位，尝试换位策略
        # 找一个已占用但可以换到其他空位的坑位
        for slot_index in range(len(assignments)):
            assignment = assignments[slot_index]
            if assignment["signup_id"] is None:
                continue
            if assignment["locked"]:
                continue
            
            # 检查当前报名是否符合这个坑位的规则
            if not cls._fits_rule(rules[slot_index], xinfa, is_rich):
                continue
            
            # 找出占用这个坑位的报名
            occupant_id = assignment["signup_id"]
            occupant = signup_map.get(occupant_id)
            if not occupant:
                continue
            
            occupant_xinfa = cls._get_signup_xinfa(occupant)
            occupant_is_rich = occupant.is_rich
            
            # 检查占用者是否可以换到其他空位
            for empty_slot in empty_slots:
                if cls._fits_rule(rules[empty_slot], occupant_xinfa, occupant_is_rich):
                    # 可以换位：把占用者移到空位，当前报名占用原位置
                    assignments[empty_slot] = {
                        "signup_id": occupant_id,
                        "locked": False
                    }
                    return slot_index
        
        # 无法安排
        return None
    
    @classmethod
    def _get_signup_xinfa(cls, signup: Signup) -> str:
        """获取报名的心法"""
        if signup.signup_info and isinstance(signup.signup_info, dict):
            return signup.signup_info.get("xinfa", "")
        return ""
    
    @classmethod
    def _fits_rule(cls, rule: Dict, xinfa: str, is_rich: bool) -> bool:
        """
        检查是否符合坑位规则
        
        规则：
        - allowRich: 是否允许老板
        - allowXinfaList: 允许的心法列表
        """
        if is_rich:
            return rule.get("allowRich", False)
        
        allow_list = rule.get("allowXinfaList", [])
        if not allow_list:
            return False
        
        return xinfa in allow_list
    
    @classmethod
    async def lock_slot(
        cls,
        db: AsyncSession,
        team_id: int,
        signup_id: int,
        slot_index: int
    ) -> AllocationResult:
        """
        锁定坑位（管理员手动分配）
        
        Args:
            db: 数据库会话
            team_id: 团队ID
            signup_id: 报名ID
            slot_index: 坑位索引 (0-24)
        """
        lock = cls._get_team_lock(team_id)
        async with lock:
            # 获取团队
            team_result = await db.execute(
                select(Team).where(Team.id == team_id)
            )
            team = team_result.scalar_one_or_none()
            if not team:
                logger.error(f"团队不存在: {team_id}")
                return AllocationResult([], [], {})
            
            max_slots = team.max_members or 25
            assignments = team.slot_assignments or [
                {"signup_id": None, "locked": False}
                for _ in range(max_slots)
            ]
            
            # 确保数组长度正确
            while len(assignments) < max_slots:
                assignments.append({"signup_id": None, "locked": False})
            
            # 如果报名已经在其他位置，先移除
            for i, a in enumerate(assignments):
                if a.get("signup_id") == signup_id:
                    assignments[i] = {"signup_id": None, "locked": False}
            
            # 如果目标位置已有其他报名，移到候补
            old_signup_id = assignments[slot_index].get("signup_id")
            waitlist = team.waitlist or []
            if old_signup_id and old_signup_id != signup_id:
                if old_signup_id not in waitlist:
                    waitlist.append(old_signup_id)
            
            # 锁定到目标位置
            assignments[slot_index] = {"signup_id": signup_id, "locked": True}
            
            # 从候补中移除
            if signup_id in waitlist:
                waitlist.remove(signup_id)
            
            team.slot_assignments = assignments
            team.waitlist = waitlist
            # 标记 JSON 字段已修改
            flag_modified(team, "slot_assignments")
            flag_modified(team, "waitlist")
            
            await db.flush()
            
            # 构建结果
            signup_results = {}
            for i, a in enumerate(assignments):
                if a["signup_id"]:
                    signup_results[a["signup_id"]] = ("allocated", i)
            for i, sid in enumerate(waitlist):
                signup_results[sid] = ("waitlist", i)
            
            return AllocationResult(
                slot_assignments=assignments,
                waitlist=waitlist,
                signup_results=signup_results
            )
    
    @classmethod
    async def unlock_slot(
        cls,
        db: AsyncSession,
        team_id: int,
        slot_index: int
    ) -> AllocationResult:
        """
        解锁坑位（移除锁定标记，但保留分配）
        """
        lock = cls._get_team_lock(team_id)
        async with lock:
            team_result = await db.execute(
                select(Team).where(Team.id == team_id)
            )
            team = team_result.scalar_one_or_none()
            if not team:
                return AllocationResult([], [], {})
            
            assignments = team.slot_assignments or []
            if slot_index < len(assignments):
                assignments[slot_index]["locked"] = False
            
            team.slot_assignments = assignments
            # 标记 JSON 字段已修改
            flag_modified(team, "slot_assignments")
            await db.flush()
            
            return await cls._do_reallocate(db, team_id)
    
    @classmethod
    async def remove_from_slot(
        cls,
        db: AsyncSession,
        team_id: int,
        signup_id: int
    ) -> AllocationResult:
        """
        从坑位移除报名（不取消报名，只是移除分配）
        """
        lock = cls._get_team_lock(team_id)
        async with lock:
            team_result = await db.execute(
                select(Team).where(Team.id == team_id)
            )
            team = team_result.scalar_one_or_none()
            if not team:
                return AllocationResult([], [], {})
            
            assignments = team.slot_assignments or []
            for i, a in enumerate(assignments):
                if a.get("signup_id") == signup_id:
                    assignments[i] = {"signup_id": None, "locked": False}
                    break
            
            team.slot_assignments = assignments
            # 标记 JSON 字段已修改
            flag_modified(team, "slot_assignments")
            await db.flush()
            
            # 重新分配以填补空缺
            return await cls._do_reallocate(db, team_id)
    
    @classmethod
    async def swap_slots(
        cls,
        db: AsyncSession,
        team_id: int,
        slot_index_a: int,
        slot_index_b: int
    ) -> AllocationResult:
        """
        交换两个坑位的分配（连连看模式）
        同时交换对应的 rule（规则），确保下次重新计算时交换效果不会失效
        """
        lock = cls._get_team_lock(team_id)
        async with lock:
            team_result = await db.execute(
                select(Team).where(Team.id == team_id)
            )
            team = team_result.scalar_one_or_none()
            if not team:
                return AllocationResult([], [], {})

            max_slots = team.max_members or 25
            assignments = team.slot_assignments or [
                {"signup_id": None, "locked": False}
                for _ in range(max_slots)
            ]

            if slot_index_a >= len(assignments) or slot_index_b >= len(assignments):
                return AllocationResult(assignments, team.waitlist or [], {})

            # 交换 slot_assignments
            assignments[slot_index_a], assignments[slot_index_b] = \
                assignments[slot_index_b], assignments[slot_index_a]

            # 同时交换 rule 数组中对应的规则
            rules = team.rule or []
            if isinstance(rules, list) and len(rules) > max(slot_index_a, slot_index_b):
                rules[slot_index_a], rules[slot_index_b] = \
                    rules[slot_index_b], rules[slot_index_a]
                team.rule = rules
                flag_modified(team, "rule")

            team.slot_assignments = assignments
            # 标记 JSON 字段已修改（SQLAlchemy 需要显式标记）
            flag_modified(team, "slot_assignments")
            await db.flush()

            # 构建结果
            signup_results = {}
            for i, a in enumerate(assignments):
                if a["signup_id"]:
                    signup_results[a["signup_id"]] = ("allocated", i)
            waitlist = team.waitlist or []
            for i, sid in enumerate(waitlist):
                signup_results[sid] = ("waitlist", i)

            return AllocationResult(
                slot_assignments=assignments,
                waitlist=waitlist,
                signup_results=signup_results
            )
    
    @classmethod
    async def get_signup_allocation_status(
        cls,
        db: AsyncSession,
        team_id: int,
        signup_id: int
    ) -> Tuple[str, Optional[int]]:
        """
        获取报名的分配状态
        
        Returns:
            (status, index): 
            - ("allocated", slot_index) 已分配到某坑位
            - ("waitlist", waitlist_position) 在候补列表中
            - ("unallocated", None) 未分配（可能是已取消或数据不一致）
        """
        team_result = await db.execute(
            select(Team).where(Team.id == team_id)
        )
        team = team_result.scalar_one_or_none()
        if not team:
            return ("unallocated", None)
        
        assignments = team.slot_assignments or []
        for i, a in enumerate(assignments):
            if a.get("signup_id") == signup_id:
                return ("allocated", i)
        
        waitlist = team.waitlist or []
        if signup_id in waitlist:
            return ("waitlist", waitlist.index(signup_id))
        
        return ("unallocated", None)


# 导出服务实例
slot_allocation_service = SlotAllocationService()
