"""
JX3API HTTP 客户端
"""
import httpx
from typing import Optional, Dict, Any, TypeVar, Type
from nonebot import logger

from ..config import Config

config = Config()

T = TypeVar('T')


class JX3APIError(Exception):
    """JX3API 错误"""
    def __init__(self, code: int, msg: str):
        self.code = code
        self.msg = msg
        super().__init__(f"JX3API Error [{code}]: {msg}")


class JX3APIClient:
    """JX3API HTTP 客户端"""
    
    def __init__(
        self,
        base_url: Optional[str] = None,
        token: Optional[str] = None,
        ticket: Optional[str] = None,
        timeout: Optional[int] = None
    ):
        self.base_url = base_url or config.jx3api_base_url
        self.token = token or config.jx3api_token
        self.ticket = ticket or config.jx3api_ticket
        self.timeout = timeout or config.api_timeout
        
        self._client: Optional[httpx.AsyncClient] = None
    
    async def _get_client(self) -> httpx.AsyncClient:
        """获取 HTTP 客户端（延迟初始化）"""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                headers={"token": self.token},
                timeout=self.timeout
            )
        return self._client
    
    async def close(self):
        """关闭客户端"""
        if self._client:
            await self._client.aclose()
            self._client = None
    
    async def post(
        self,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        use_ticket: bool = False
    ) -> Dict[str, Any]:
        """
        发送 POST 请求
        
        Args:
            endpoint: API 端点
            data: 请求数据
            use_ticket: 是否使用推栏 ticket
            
        Returns:
            API 响应数据
        """
        client = await self._get_client()
        
        # 准备请求数据
        request_data = data.copy() if data else {}
        if use_ticket and self.ticket:
            request_data["ticket"] = self.ticket
        
        try:
            logger.debug(f"JX3API POST {endpoint}: {request_data}")
            response = await client.post(endpoint, json=request_data)
            response.raise_for_status()
            result = response.json()

            # 检查 API 响应状态
            # JX3API 使用 HTTP 状态码风格：200 表示成功
            code = result.get("code", -1)
            if code not in [0, 200]:
                msg = result.get("msg", "未知错误")
                # 记录完整的错误响应以便调试
                logger.warning(f"JX3API 错误响应 {endpoint}: code={code}, msg={msg}, data={result.get('data')}")
                raise JX3APIError(code, msg)

            return result
            
        except httpx.HTTPStatusError as e:
            logger.error(f"JX3API HTTP 错误: {e}")
            raise JX3APIError(-1, f"HTTP 错误: {e.response.status_code}")
        except httpx.RequestError as e:
            logger.error(f"JX3API 请求错误: {e}")
            raise JX3APIError(-1, f"请求错误: {str(e)}")
    
    # ============== 活动相关 ==============
    
    async def get_active_calendar(
        self,
        server: Optional[str] = None,
        num: int = 0
    ) -> Dict[str, Any]:
        """获取活动日历"""
        data = {}
        if server:
            data["server"] = server
        data["num"] = num
        return await self.post("/data/active/calendar", data)
    
    async def get_active_list_calendar(self, num: int = 15) -> Dict[str, Any]:
        """获取活动月历"""
        return await self.post("/data/active/list/calendar", {"num": num})
    
    async def get_active_celebs(self, name: str) -> Dict[str, Any]:
        """获取声望活动进度（楚天社/云从社/披风会）"""
        return await self.post("/data/active/celebs", {"name": name})
    
    async def get_active_monster(self) -> Dict[str, Any]:
        """获取百战异闻录"""
        return await self.post("/data/active/monster")
    
    async def get_active_next_event(self, server: Optional[str] = None) -> Dict[str, Any]:
        """获取下次扶摇时间"""
        data = {"server": server} if server else {}
        return await self.post("/data/active/next/event", data)
    
    # ============== 服务器相关 ==============
    
    async def get_server_check(self, server: Optional[str] = None) -> Dict[str, Any]:
        """获取服务器开服状态"""
        data = {}
        if server:
            data["server"] = server
        return await self.post("/data/server/check", data)
    
    async def get_server_status(self, server: str) -> Dict[str, Any]:
        """获取服务器热度"""
        return await self.post("/data/server/status", {"server": server})
    
    async def get_server_master(self, name: str) -> Dict[str, Any]:
        """获取服务器信息"""
        return await self.post("/data/server/master", {"name": name})
    
    async def get_server_sand(self, server: str) -> Dict[str, Any]:
        """获取沙盘信息"""
        return await self.post("/data/server/sand", {"server": server})
    
    async def get_server_antivice(self, server: str) -> Dict[str, Any]:
        """获取诛恶事件"""
        return await self.post("/data/server/antivice", {"server": server})
    
    async def get_server_leader(self) -> Dict[str, Any]:
        """获取关隘首领"""
        return await self.post("/data/server/leader")
    
    async def get_server_event(self) -> Dict[str, Any]:
        """获取跨服阵营事件"""
        return await self.post("/data/server/event")
    
    # ============== 角色相关 ==============
    
    async def get_role_detailed(self, server: str, name: str) -> Dict[str, Any]:
        """获取角色详情"""
        return await self.post("/data/role/detailed", {"server": server, "name": name}, use_ticket=True)
    
    async def get_role_attribute(self, server: str, name: str) -> Dict[str, Any]:
        """获取角色属性"""
        return await self.post("/data/role/attribute", {"server": server, "name": name}, use_ticket=True)
    
    async def get_role_monster(self, server: str, name: str) -> Dict[str, Any]:
        """获取角色精耐"""
        return await self.post("/data/role/monster", {"server": server, "name": name})
    
    async def get_role_achievement(
        self,
        server: str,
        role: str,
        name: str
    ) -> Dict[str, Any]:
        """获取角色成就"""
        return await self.post(
            "/data/role/achievement",
            {"server": server, "role": role, "name": name},
            use_ticket=True
        )
    
    async def get_role_team_cd_list(self, server: str, name: str) -> Dict[str, Any]:
        """获取副本进度"""
        return await self.post("/data/role/teamCdList", {"server": server, "name": name}, use_ticket=True)
    
    async def get_role_online_status(self, server: str, name: str) -> Dict[str, Any]:
        """获取在线状态"""
        return await self.post("/data/role/online/status", {"server": server, "name": name})
    
    async def save_role_detailed(self, server: str, roleid: str) -> Dict[str, Any]:
        """更新角色数据"""
        return await self.post("/save/role/detailed", {"server": server, "roleid": roleid}, use_ticket=True)
    
    # ============== 奇遇相关 ==============
    
    async def get_luck_adventure(self, server: str, name: str) -> Dict[str, Any]:
        """获取奇遇记录"""
        return await self.post("/data/luck/adventure", {"server": server, "name": name}, use_ticket=True)
    
    async def get_luck_statistical(
        self,
        server: str,
        name: str,
        limit: int = 50
    ) -> Dict[str, Any]:
        """获取奇遇统计"""
        return await self.post("/data/luck/statistical", {"server": server, "name": name, "limit": limit})
    
    async def get_luck_recent(self, server: str) -> Dict[str, Any]:
        """获取近期奇遇"""
        return await self.post("/data/luck/recent", {"server": server})
    
    async def get_luck_unfinished(self, server: str, name: str) -> Dict[str, Any]:
        """获取未完成奇遇"""
        return await self.post("/data/luck/unfinished", {"server": server, "name": name}, use_ticket=True)
    
    async def get_luck_collect(self, server: str, num: int = 7) -> Dict[str, Any]:
        """获取奇遇汇总"""
        return await self.post("/data/luck/collect", {"server": server, "num": num})
    
    async def get_luck_server_statistical(self, name: str, limit: int = 10) -> Dict[str, Any]:
        """获取全服奇遇统计"""
        return await self.post("/data/luck/server/statistical", {"name": name, "limit": limit})
    
    # ============== 交易相关 ==============
    
    async def get_trade_demon(
        self,
        server: Optional[str] = None,
        limit: int = 10
    ) -> Dict[str, Any]:
        """获取金价"""
        data = {"limit": limit}
        if server:
            data["server"] = server
        return await self.post("/data/trade/demon", data)
    
    async def get_trade_item_records(
        self,
        name: str,
        server: Optional[str] = None
    ) -> Dict[str, Any]:
        """获取物价记录"""
        data = {"name": name}
        if server:
            data["server"] = server
        return await self.post("/data/trade/item/records", data)
    
    async def get_trade_records(
        self,
        name: str,
        server: Optional[str] = None
    ) -> Dict[str, Any]:
        """获取物价统计"""
        data = {"name": name}
        if server:
            data["server"] = server
        return await self.post("/data/trade/records", data)
    
    async def get_trade_market(self, server: str, name: str) -> Dict[str, Any]:
        """获取交易行价格"""
        return await self.post("/data/trade/market", {"server": server, "name": name})
    
    async def get_trade_search(self, name: str) -> Dict[str, Any]:
        """搜索物品"""
        return await self.post("/data/trade/search", {"name": name})
    
    async def get_tieba_item_records(
        self,
        name: str,
        server: Optional[str] = None,
        limit: int = 10
    ) -> Dict[str, Any]:
        """获取贴吧物价"""
        data = {"name": name, "limit": limit}
        if server:
            data["server"] = server
        return await self.post("/data/tieba/item/records", data)
    
    async def get_auction_records(
        self,
        server: str,
        name: Optional[str] = None,
        limit: int = 50
    ) -> Dict[str, Any]:
        """获取拍卖记录"""
        data = {"server": server, "limit": limit}
        if name:
            data["name"] = name
        return await self.post("/data/auction/records", data)
    
    async def get_dilu_records(self, server: Optional[str] = None) -> Dict[str, Any]:
        """获取的卢记录"""
        data = {"server": server} if server else {}
        return await self.post("/data/dilu/records", data)
    
    async def get_chitu_records(self) -> Dict[str, Any]:
        """获取赤兔记录"""
        return await self.post("/data/chitu/records")
    
    async def get_horse_ranch(self, server: str) -> Dict[str, Any]:
        """获取马场信息"""
        return await self.post("/data/horse/ranch", {"server": server})
    
    async def get_reward_server_statistical(self, name: str, limit: int = 30) -> Dict[str, Any]:
        """获取全服掉落统计"""
        return await self.post("/data/reward/server/statistical", {"name": name, "limit": limit})
    
    async def get_reward_statistical(
        self,
        server: str,
        name: str,
        limit: int = 20
    ) -> Dict[str, Any]:
        """获取区服掉落统计"""
        return await self.post("/data/reward/statistical", {"server": server, "name": name, "limit": limit})
    
    # ============== 招募相关 ==============
    
    async def get_member_recruit(
        self,
        server: str,
        keyword: Optional[str] = None,
        table: int = 1
    ) -> Dict[str, Any]:
        """获取团队招募"""
        data = {"server": server, "table": table}
        if keyword:
            data["keyword"] = keyword
        return await self.post("/data/member/recruit", data)
    
    async def get_member_teacher(
        self,
        server: str,
        keyword: Optional[str] = None
    ) -> Dict[str, Any]:
        """获取师父招募"""
        data = {"server": server}
        if keyword:
            data["keyword"] = keyword
        return await self.post("/data/member/teacher", data)
    
    async def get_member_student(
        self,
        server: str,
        keyword: Optional[str] = None
    ) -> Dict[str, Any]:
        """获取徒弟招募"""
        data = {"server": server}
        if keyword:
            data["keyword"] = keyword
        return await self.post("/data/member/student", data)
    
    # ============== 竞技场相关 ==============
    
    async def get_arena_awesome(
        self,
        mode: str = "33",
        limit: int = 20
    ) -> Dict[str, Any]:
        """获取名剑排行"""
        return await self.post("/data/arena/awesome", {"mode": mode, "limit": limit}, use_ticket=True)
    
    async def get_arena_recent(
        self,
        server: str,
        name: str,
        mode: str = "33"
    ) -> Dict[str, Any]:
        """获取战绩记录"""
        return await self.post(
            "/data/arena/recent",
            {"server": server, "name": name, "mode": mode},
            use_ticket=True
        )
    
    async def get_arena_schools(self, mode: str = "33") -> Dict[str, Any]:
        """获取门派表现"""
        return await self.post("/data/arena/schools", {"mode": mode}, use_ticket=True)
    
    # ============== 排行榜相关 ==============
    
    async def get_rank_statistical(
        self,
        server: str,
        table: str,
        name: str
    ) -> Dict[str, Any]:
        """获取区服排行榜"""
        return await self.post("/data/rank/statistical", {"server": server, "table": table, "name": name})
    
    async def get_rank_server_statistical(self, table: str, name: str) -> Dict[str, Any]:
        """获取全服排行榜"""
        return await self.post("/data/rank/server/statistical", {"table": table, "name": name})
    
    # ============== 心法相关 ==============
    
    async def get_school_force(self, name: str) -> Dict[str, Any]:
        """获取心法奇穴"""
        return await self.post("/data/school/force", {"name": name}, use_ticket=True)
    
    async def get_school_matrix(self, name: str) -> Dict[str, Any]:
        """获取心法阵眼"""
        return await self.post("/data/school/matrix", {"name": name}, use_ticket=True)
    
    async def get_school_skills(self, name: str) -> Dict[str, Any]:
        """获取心法技能"""
        return await self.post("/data/school/skills", {"name": name}, use_ticket=True)
    
    async def get_school_seniority(self, school: str) -> Dict[str, Any]:
        """获取心法资历排行"""
        return await self.post("/data/school/seniority", {"school": school}, use_ticket=True)
    
    # ============== 烟花相关 ==============
    
    async def get_fireworks_collect(self, server: str, num: int = 7) -> Dict[str, Any]:
        """获取烟花统计"""
        return await self.post("/data/fireworks/collect", {"server": server, "num": num})
    
    async def get_fireworks_records(self, server: str, name: str) -> Dict[str, Any]:
        """获取烟花记录"""
        return await self.post("/data/fireworks/records", {"server": server, "name": name})
    
    async def get_fireworks_statistical(
        self,
        server: str,
        name: str,
        limit: int = 20
    ) -> Dict[str, Any]:
        """获取烟花汇总"""
        return await self.post("/data/fireworks/statistical", {"server": server, "name": name, "limit": limit})
    
    # ============== 宠物相关 ==============
    
    async def get_archived_pet_event(self, server: str) -> Dict[str, Any]:
        """获取宠物刷新记录"""
        return await self.post("/data/archived/petEvent", {"server": server})
    
    # ============== 其他 ==============
    
    async def get_exam_answer(self, subject: str, limit: int = 3) -> Dict[str, Any]:
        """获取科举答案"""
        return await self.post("/data/exam/answer", {"subject": subject, "limit": limit})
    
    async def get_home_furniture(self, name: str) -> Dict[str, Any]:
        """获取家园装饰"""
        return await self.post("/data/home/furniture", {"name": name})
    
    async def get_home_travel(self, name: str) -> Dict[str, Any]:
        """获取器物谱"""
        return await self.post("/data/home/travel", {"name": name})
    
    async def get_home_flower(
        self,
        server: str,
        name: Optional[str] = None,
        map_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """获取家园花卉"""
        data = {"server": server}
        if name:
            data["name"] = name
        if map_name:
            data["map"] = map_name
        return await self.post("/data/home/flower", data)
    
    async def get_news_allnews(self, limit: int = 5) -> Dict[str, Any]:
        """获取官方新闻"""
        return await self.post("/data/news/allnews", {"limit": limit})
    
    async def get_news_announce(self, limit: int = 5) -> Dict[str, Any]:
        """获取维护公告"""
        return await self.post("/data/news/announce", {"limit": limit})
    
    async def get_skills_records(self) -> Dict[str, Any]:
        """获取技改记录"""
        return await self.post("/data/skills/records")
    
    async def get_archived_pendant(self, name: str) -> Dict[str, Any]:
        """获取挂件信息"""
        return await self.post("/data/archived/pendant", {"name": name})
    
    async def get_fraud_detailed(self, uid: str) -> Dict[str, Any]:
        """获取骗子查询"""
        return await self.post("/data/fraud/detailed", {"uid": uid})
    
    async def get_saohua_random(self) -> Dict[str, Any]:
        """获取随机骚话"""
        return await self.post("/data/saohua/random")
    
    async def get_saohua_content(self) -> Dict[str, Any]:
        """获取舔狗日记"""
        return await self.post("/data/saohua/content")
    
    async def get_show_card(self, server: str, name: str) -> Dict[str, Any]:
        """获取名片"""
        return await self.post("/data/show/card", {"server": server, "name": name})
    
    async def get_show_random(
        self,
        server: Optional[str] = None,
        body: Optional[str] = None,
        force: Optional[str] = None
    ) -> Dict[str, Any]:
        """获取随机名片"""
        data = {}
        if server:
            data["server"] = server
        if body:
            data["body"] = body
        if force:
            data["force"] = force
        return await self.post("/data/show/random", data)
    
    async def get_show_cache(self, server: str, name: str) -> Dict[str, Any]:
        """获取名片墙缓存"""
        return await self.post("/data/show/cache", {"server": server, "name": name})
    
    async def get_show_records(self, server: str, name: str) -> Dict[str, Any]:
        """获取名片墙"""
        return await self.post("/data/show/records", {"server": server, "name": name})


# 全局 API 客户端实例
api_client = JX3APIClient()
