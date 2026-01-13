"""
JX3API 响应类型定义
"""
from typing import Optional, List, Dict, Any, TypedDict
from dataclasses import dataclass


# 基础响应类型
class JX3APIResponse(TypedDict):
    """JX3API 基础响应"""
    code: int
    msg: str


# ============== 活动相关 ==============

class ActiveCalendarData(TypedDict):
    """活动日历数据"""
    date: str
    week: str
    war: str
    battle: str
    orecar: str
    school: str
    rescue: str
    luck: List[str]
    card: List[str]
    team: List[str]
    draw: str


class ActiveCalendar(JX3APIResponse):
    """活动日历响应"""
    data: ActiveCalendarData


class ActiveListCalendarDay(TypedDict):
    """日历每日数据"""
    date: str
    day: str
    week: str
    war: str
    battle: str
    orecar: str
    school: str
    rescue: str
    luck: List[str]
    card: List[str]


class ActiveListCalendarData(TypedDict):
    """活动列表日历数据"""
    today: Dict[str, str]
    data: List[ActiveListCalendarDay]


class ActiveListCalendar(JX3APIResponse):
    """活动列表日历响应"""
    data: ActiveListCalendarData


class CelebsItem(TypedDict):
    """声望活动进度项"""
    map: str
    stage: str
    site: str
    desc: str
    icon: str
    time: str


class ActiveCelebs(JX3APIResponse):
    """声望活动响应"""
    data: List[CelebsItem]


class MonsterBoss(TypedDict):
    """百战BOSS数据"""
    level: int
    name: str
    skill: List[str]
    data: Dict[str, Any]


class ActiveMonsterData(TypedDict):
    """百战异闻录数据"""
    start: int
    end: int
    data: List[MonsterBoss]


class ActiveMonster(JX3APIResponse):
    """百战异闻录响应"""
    data: ActiveMonsterData


class ActiveNextEvent(JX3APIResponse):
    """下次扶摇时间响应"""
    data: Dict[str, Any]


# ============== 服务器相关 ==============

class ServerCheckData(TypedDict):
    """服务器状态数据"""
    id: int
    zone: str
    server: str
    status: int
    time: int


class ServerCheck(JX3APIResponse):
    """服务器状态响应"""
    data: ServerCheckData


class ServerStatusData(TypedDict):
    """服务器热度数据"""
    zone: str
    server: str
    status: str


class ServerStatus(JX3APIResponse):
    """服务器热度响应"""
    data: ServerStatusData


class ServerMasterData(TypedDict):
    """服务器信息数据"""
    id: str
    zone: str
    name: str
    column: str
    duowan: Dict[str, List[int]]
    abbreviation: List[str]
    subordinate: List[str]


class ServerMaster(JX3APIResponse):
    """服务器信息响应"""
    data: ServerMasterData


class ServerSandData(TypedDict):
    """沙盘数据"""
    zone: str
    server: str
    reset: int
    update: int
    data: List[Dict[str, Any]]


class ServerSand(JX3APIResponse):
    """沙盘响应"""
    data: ServerSandData


class ServerAntivice(JX3APIResponse):
    """诛恶事件响应"""
    data: List[Dict[str, Any]]


class ServerLeader(JX3APIResponse):
    """关隘首领响应"""
    data: List[Dict[str, Any]]


class ServerEvent(JX3APIResponse):
    """跨服阵营事件响应"""
    data: List[Dict[str, Any]]


# ============== 角色相关 ==============

class RoleDetailedData(TypedDict):
    """角色详情数据"""
    zoneName: str
    serverName: str
    roleName: str
    roleId: str
    globalRoleId: str
    forceName: str
    forceId: str
    bodyName: str
    bodyId: str
    tongName: str
    tongId: str
    campName: str
    campId: str
    personName: str
    personId: str
    personAvatar: str


class RoleDetailed(JX3APIResponse):
    """角色详情响应"""
    data: RoleDetailedData


class RoleAttribute(JX3APIResponse):
    """角色属性响应"""
    data: Dict[str, Any]


class RoleMonster(JX3APIResponse):
    """角色精耐响应"""
    data: Dict[str, Any]


class RoleAchievement(JX3APIResponse):
    """角色成就响应"""
    data: Dict[str, Any]


class TeamCdList(JX3APIResponse):
    """副本进度响应"""
    data: Dict[str, Any]


class RoleOnlineStatus(JX3APIResponse):
    """在线状态响应"""
    data: Dict[str, Any]


# ============== 奇遇相关 ==============

class LuckAdventureItem(TypedDict):
    """奇遇记录项"""
    zone: str
    server: str
    name: str
    event: str
    level: int
    time: int


class LuckAdventure(JX3APIResponse):
    """奇遇记录响应"""
    data: List[LuckAdventureItem]


class LuckStatistical(JX3APIResponse):
    """奇遇统计响应"""
    data: List[Dict[str, Any]]


class LuckRecent(JX3APIResponse):
    """近期奇遇响应"""
    data: List[Dict[str, Any]]


class LuckUnfinished(JX3APIResponse):
    """未完成奇遇响应"""
    data: List[Dict[str, Any]]


class LuckCollect(JX3APIResponse):
    """奇遇汇总响应"""
    data: List[Dict[str, Any]]


class LuckServerStatistical(JX3APIResponse):
    """全服奇遇统计响应"""
    data: List[Dict[str, Any]]


# ============== 交易相关 ==============

class TradeDemonData(TypedDict):
    """金价数据"""
    zone: str
    server: str
    tieba: float
    wanbaolou: float
    dd373: float
    uu898: float
    5173: float
    7881: float
    time: int


class TradeDemon(JX3APIResponse):
    """金价响应"""
    data: List[TradeDemonData]


class TradeItemRecord(JX3APIResponse):
    """物价记录响应"""
    data: Dict[str, Any]


class TradeRecords(JX3APIResponse):
    """物价统计响应"""
    data: List[Dict[str, Any]]


class TradeMarket(JX3APIResponse):
    """交易行价格响应"""
    data: Dict[str, Any]


class TradeSearch(JX3APIResponse):
    """物品搜索响应"""
    data: List[Dict[str, Any]]


class TiebaItemRecord(JX3APIResponse):
    """贴吧物价响应"""
    data: List[Dict[str, Any]]


class AuctionRecord(JX3APIResponse):
    """拍卖记录响应"""
    data: List[Dict[str, Any]]


class DiluRecord(JX3APIResponse):
    """的卢记录响应"""
    data: List[Dict[str, Any]]


class ChituRecord(JX3APIResponse):
    """赤兔记录响应"""
    data: List[Dict[str, Any]]


class HorseRanch(JX3APIResponse):
    """马场信息响应"""
    data: List[Dict[str, Any]]


class RewardServerStatistical(JX3APIResponse):
    """全服掉落统计响应"""
    data: List[Dict[str, Any]]


class RewardStatistical(JX3APIResponse):
    """区服掉落统计响应"""
    data: List[Dict[str, Any]]


# ============== 招募相关 ==============

class MemberRecruit(JX3APIResponse):
    """团队招募响应"""
    data: List[Dict[str, Any]]


class MemberTeacher(JX3APIResponse):
    """师父招募响应"""
    data: List[Dict[str, Any]]


class MemberStudent(JX3APIResponse):
    """徒弟招募响应"""
    data: List[Dict[str, Any]]


# ============== 竞技场相关 ==============

class ArenaAwesome(JX3APIResponse):
    """名剑排行响应"""
    data: List[Dict[str, Any]]


class ArenaRecent(JX3APIResponse):
    """战绩记录响应"""
    data: List[Dict[str, Any]]


class ArenaSchools(JX3APIResponse):
    """门派表现响应"""
    data: List[Dict[str, Any]]


# ============== 排行榜相关 ==============

class RankStatistical(JX3APIResponse):
    """区服排行榜响应"""
    data: List[Dict[str, Any]]


class RankServerStatistical(JX3APIResponse):
    """全服排行榜响应"""
    data: List[Dict[str, Any]]


# ============== 心法相关 ==============

class SchoolForce(JX3APIResponse):
    """心法奇穴响应"""
    data: Dict[str, Any]


class SchoolMatrix(JX3APIResponse):
    """心法阵眼响应"""
    data: Dict[str, Any]


class SchoolSkill(JX3APIResponse):
    """心法技能响应"""
    data: List[Dict[str, Any]]


class SchoolSeniority(JX3APIResponse):
    """心法资历排行响应"""
    data: List[Dict[str, Any]]


# ============== 烟花相关 ==============

class FireworksCollect(JX3APIResponse):
    """烟花统计响应"""
    data: List[Dict[str, Any]]


class FireworksRecord(JX3APIResponse):
    """烟花记录响应"""
    data: List[Dict[str, Any]]


class FireworksStatistical(JX3APIResponse):
    """烟花汇总响应"""
    data: List[Dict[str, Any]]


# ============== 其他 ==============

class ExamAnswerItem(TypedDict):
    """科举答案项"""
    id: int
    question: str
    answer: str
    correctness: int
    index: int
    pinyin: str


class ExamAnswer(JX3APIResponse):
    """科举答案响应"""
    data: List[ExamAnswerItem]


class HomeFurniture(JX3APIResponse):
    """家园装饰响应"""
    data: List[Dict[str, Any]]


class HomeTravel(JX3APIResponse):
    """器物谱响应"""
    data: List[Dict[str, Any]]


class HomeFlower(JX3APIResponse):
    """家园花卉响应"""
    data: Dict[str, Any]


class NewsItem(JX3APIResponse):
    """新闻响应"""
    data: List[Dict[str, Any]]


class NewsAnnounce(JX3APIResponse):
    """维护公告响应"""
    data: List[Dict[str, Any]]


class SkillRecords(JX3APIResponse):
    """技改记录响应"""
    data: List[Dict[str, Any]]


class ArchivedPendant(JX3APIResponse):
    """挂件信息响应"""
    data: Dict[str, Any]


class ArchivedPetEvent(JX3APIResponse):
    """宠物刷新记录响应"""
    data: List[Dict[str, Any]]


class FraudDetailed(JX3APIResponse):
    """骗子查询响应"""
    data: Dict[str, Any]


class SaohuaRandom(JX3APIResponse):
    """随机骚话响应"""
    data: Dict[str, Any]


class SaohuaContent(JX3APIResponse):
    """舔狗日记响应"""
    data: Dict[str, Any]


class ShowCard(JX3APIResponse):
    """名片响应"""
    data: Dict[str, Any]


class ShowRandom(JX3APIResponse):
    """随机名片响应"""
    data: Dict[str, Any]


class ShowCache(JX3APIResponse):
    """名片墙缓存响应"""
    data: Dict[str, Any]


class ShowRecords(JX3APIResponse):
    """名片墙响应"""
    data: List[Dict[str, Any]]
