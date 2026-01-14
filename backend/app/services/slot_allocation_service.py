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

        策略：
        1. 保留所有现有分配（包括连连看手动交换的结果）
        2. 检查每个现有分配是否仍然符合规则
        3. 如果某个分配不再符合规则：清空该坑位，将该报名加入待分配列表
        4. 按报名顺序处理待分配的报名（新报名 + 因修改不符合规则的报名）
        5. 无法安排的加入候补
        
        这样可以确保：
        - 连连看手动交换的结果被保留
        - 修改报名后，如果仍符合原坑位规则则保留原位
        - 修改报名后，如果不符合原坑位规则则重新分配
        - 报名顺序决定优先级，不会被后来的人挤掉
        """
        # 构建报名ID到报名对象的映射
        signup_map = {s.id: s for s in signups}
        signup_ids = set(s.id for s in signups)

        logger.info(f"[排坑] 开始执行排坑算法，共有 {len(signups)} 个报名")
        for s in signups:
            xinfa = cls._get_signup_xinfa(s)
            logger.info(f"[排坑] 报名ID={s.id}, 心法={xinfa}, 老板={s.is_rich}, 创建时间={s.created_at}")

        # 初始化分配数组（全部为空）
        assignments: List[Dict[str, Any]] = [
            {"signup_id": None, "locked": False}
            for _ in range(max_slots)
        ]

        # 保留所有现有分配，但检查是否仍然符合规则
        # 不符合规则的会被加入待重新分配列表
        retained_signup_ids = set()
        needs_reallocation_ids = set()
        
        logger.info(f"[排坑] 检查现有分配，共有 {len(current_assignments)} 个坑位")
        for i, assignment in enumerate(current_assignments):
            if i >= max_slots:
                break
            if assignment and assignment.get("signup_id"):
                signup_id = assignment["signup_id"]
                logger.info(f"[排坑] 坑位{i}: 报名ID={signup_id}, 锁定={assignment.get('locked', False)}")
                
                if signup_id in signup_ids:
                    signup = signup_map[signup_id]
                    xinfa = cls._get_signup_xinfa(signup)
                    is_rich = signup.is_rich
                    
                    rule = rules[i]
                    allow_rich = rule.get("allowRich", False)
                    allow_xinfa_list = rule.get("allowXinfaList", [])
                    
                    logger.info(f"[排坑] 坑位{i}规则: allowRich={allow_rich}, allowXinfaList={allow_xinfa_list}")
                    logger.info(f"[排坑] 报名{signup_id}信息: xinfa={xinfa}, is_rich={is_rich}")
                    
                    # 检查是否仍然符合坑位规则
                    if cls._fits_rule(rules[i], xinfa, is_rich):
                        # 仍然符合规则，保留分配
                        assignments[i] = {
                            "signup_id": signup_id,
                            "locked": assignment.get("locked", False)
                        }
                        retained_signup_ids.add(signup_id)
                        logger.info(f"[排坑] ✓ 报名{signup_id}符合坑位{i}规则，保留原位")
                    else:
                        # 不再符合规则，清空该坑位，加入待重新分配列表
                        needs_reallocation_ids.add(signup_id)
                        logger.warning(f"[排坑] ✗ 报名{signup_id}不再符合坑位{i}规则，需要重新分配")
                else:
                    logger.info(f"[排坑] 坑位{i}的报名{signup_id}已不存在，清空")

        # 按报名顺序构建待分配列表（新报名 + 因修改不符合规则的报名）
        signups_to_allocate = []
        for s in signups:
            if s.id not in retained_signup_ids:
                signups_to_allocate.append(s)
        
        logger.info(f"[排坑] 需要分配的报名: {[s.id for s in signups_to_allocate]}")
        logger.info(f"[排坑] 已保留的报名: {list(retained_signup_ids)}")
        
        waitlist: List[int] = []
        signup_results: Dict[int, Tuple[str, Optional[int]]] = {}

        # 记录已保留的报名结果
        for i, a in enumerate(assignments):
            if a["signup_id"]:
                signup_results[a["signup_id"]] = ("allocated", i)

        # 按报名顺序分配所有待分配的报名
        logger.info(f"[排坑] 开始分配 {len(signups_to_allocate)} 个报名")
        for signup in signups_to_allocate:
            xinfa = cls._get_signup_xinfa(signup)
            logger.info(f"[排坑] 尝试分配报名{signup.id} (心法={xinfa}, 老板={signup.is_rich})")
            
            slot_index = cls._find_slot_for_signup(assignments, rules, signup, signup_map)

            if slot_index is not None:
                # 检查这个坑位是否已被占用（可能是被保留的报名）
                existing_assignment = assignments[slot_index]
                if existing_assignment["signup_id"] is not None:
                    # 坑位已被占用，需要检查优先级
                    occupant_id = existing_assignment["signup_id"]
                    occupant = signup_map.get(occupant_id)
                    
                    if occupant and signup.created_at < occupant.created_at:
                        # 当前报名优先级更高，抢占该坑位
                        logger.warning(f"[排坑] 报名{signup.id}优先级高于报名{occupant_id}，抢占坑位{slot_index}")
                        # 被抢占的报名加入待分配队列（会在后续处理）
                        signups_to_allocate.append(occupant)
                        # 从保留列表中移除
                        if occupant_id in retained_signup_ids:
                            retained_signup_ids.remove(occupant_id)
                        # 从结果中移除
                        if occupant_id in signup_results:
                            del signup_results[occupant_id]
                
                assignments[slot_index] = {
                    "signup_id": signup.id,
                    "locked": False
                }
                signup_results[signup.id] = ("allocated", slot_index)
                logger.info(f"[排坑] ✓ 报名{signup.id}成功分配到坑位{slot_index}")
            else:
                # 无法分配，加入候补
                waitlist.append(signup.id)
                signup_results[signup.id] = ("waitlist", len(waitlist) - 1)
                logger.info(f"[排坑] ✗ 报名{signup.id}无法分配，加入候补(位置{len(waitlist)-1})")

        logger.info(f"[排坑] 排坑完成: 已分配{sum(1 for a in assignments if a['signup_id'])}人, 候补{len(waitlist)}人")
        
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
        
        logger.info(f"[查找坑位] 为报名{signup.id}查找坑位 (心法={xinfa}, 老板={is_rich})")
        
        # 找出所有空位
        empty_slots = [
            i for i, a in enumerate(assignments)
            if a["signup_id"] is None
        ]
        
        logger.info(f"[查找坑位] 空位列表: {empty_slots}")
        
        # 在空位中找符合规则的
        for slot_index in empty_slots:
            rule = rules[slot_index]
            allow_rich = rule.get("allowRich", False)
            allow_xinfa_list = rule.get("allowXinfaList", [])
            
            logger.info(f"[查找坑位] 检查空位{slot_index}: allowRich={allow_rich}, allowXinfaList={allow_xinfa_list}")
            
            if cls._fits_rule(rules[slot_index], xinfa, is_rich):
                logger.info(f"[查找坑位] ✓ 空位{slot_index}符合规则，返回")
                return slot_index
            else:
                logger.info(f"[查找坑位] ✗ 空位{slot_index}不符合规则")
        
        logger.info(f"[查找坑位] 没有符合规则的空位，尝试换位策略")
        
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
            
            # 检查优先级：当前报名的created_at必须早于（或等于）占用者
            # 这样才能保证报名顺序的公平性
            if signup.created_at > occupant.created_at:
                logger.info(f"[查找坑位] 坑位{slot_index}被优先级更高的报名{occupant_id}占据，跳过")
                continue
            
            logger.info(f"[查找坑位] 坑位{slot_index}当前由报名{occupant_id}占据，检查是否可以换位")
            
            occupant_xinfa = cls._get_signup_xinfa(occupant)
            occupant_is_rich = occupant.is_rich
            
            # 检查占用者是否可以换到其他空位
            can_swap = False
            for empty_slot in empty_slots:
                if cls._fits_rule(rules[empty_slot], occupant_xinfa, occupant_is_rich):
                    logger.info(f"[查找坑位] ✓ 可以换位: 报名{occupant_id}移到空位{empty_slot}，报名{signup.id}占据坑位{slot_index}")
                    # 可以换位：把占用者移到空位，当前报名占用原位置
                    assignments[empty_slot] = {
                        "signup_id": occupant_id,
                        "locked": False
                    }
                    can_swap = True
                    return slot_index
            
            # 如果无法换位，但当前报名优先级更高，仍然返回该坑位（让_allocate处理抢占逻辑）
            if not can_swap:
                logger.info(f"[查找坑位] 占用者{occupant_id}无法换位，但报名{signup.id}优先级更高，返回坑位{slot_index}（将触发抢占）")
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
