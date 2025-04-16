import json
from datetime import datetime
from db_handler import DatabaseHandler
from botpy import logging
from typing import Dict, List, Tuple, Optional

_log = logging.get_logger()

# region 返回信息配置
MSG_DETAILS = {
    "K-具体排坑": "具体排坑情况请查看开团看板。(已加入队列, 可能会候补)",

}

RET_MSG = {
    "K-未绑定":"请先绑定QQ号",
    "K-未开团":"还没有开团，别急，尊重夕阳红命运...",
    "K-团已锁":"车门已经焊死了，无法自由报名，请联系团长或管理员。",
    "K-未指定团号":"你想报名哪一车？请指明团队序号。\n{team_list}",
    "K-无效团队序号":"你指定的团队'{team_idx}'序号无效，请重新输入。\n{team_list}",
    "K-报名格式错误": "格式错误，报名格式说明：\n"
                    "/报名 [团队序号] <角色名> -- 快捷报名角色 [推荐]\n"
                    "/报名 [团队序号] <心法名> -- 模糊报名(不指定角色)\n"
                    "/报名 [团队序号] <心法名> <角色名> -- 常规报名\n"
                    "/报名 [团队序号] <角色名> <心法名> -- 常规报名",
    "K-角色不明确":"你有多个同名角色，需要指定心法。\n{character_list}",
    "K-无效心法":"无法将'{xinfa}'解析为心法名称。",
    "K-报名成功":"报名成功！具体排坑情况请查看开团看板。(已加入队列, 可能会候补)",
    "K-添加常用角色":"hint: 已经将角色 {character_name}({xinfa}) 添加到常用角色列表。可访问网页端管理。",
    "K-建议指明角色":"hint: 建议指定角色名，方便团长招募放人。",
    "K-代报名格式错误":"格式错误，代报名格式说明：\n"
                    "/代报名 [团队序号] <参与人昵称> <心法名> <角色名> -- [推荐]\n"
                    "/代报名 [团队序号] <参与人昵称> <心法名> -- 不指定角色",
    "K-代报名成功":"代报名成功！具体排坑情况请查看开团看板。(已加入队列, 可能会候补)\n",
    "K-登记老板格式错误":"格式错误，登记老板格式说明：\n"
                    "/登记老板 [团队序号] <老板昵称> <心法名> <角色名> -- [推荐]\n"
                    "/登记老板 [团队序号] <老板昵称> <心法名> -- 不指定角色",
    "K-登记老板成功":"登记老板成功！具体排坑情况请查看开团看板。(已加入队列, 可能会候补)}\n",
    "K-取消报名格式错误":"格式错误，取消报名格式说明：\n"
                    "/取消报名 [团队序号] [编号]",
    "K-未报名":"没有找到关于你的报名记录，请查看开团看板。",
    "K-取消报名成功":"取消报名成功！\n{signup_info}",
    "K-多个报名记录":"找到多个报名记录，请提供编号取消：\n{signup_list}",
    "K-取消报名编号无效":"报名编号无效，请检查输入。\n{signup_list}",
}

# endregion

class TeamService:
    """团队相关服务"""
    def __init__(self, db: DatabaseHandler):
        self.db = db
    
    def get_active_teams(self) -> List[Dict]:
        """获取所有活跃团队"""
        query = "SELECT id, title, is_lock FROM teams WHERE close_time IS NULL AND is_hidden = FALSE ORDER BY team_time"
        return self.db.execute_query(query, fetchall=True)

class CharacterService:
    """角色管理服务"""
    def __init__(self, db: DatabaseHandler, xinfa_config: Dict):
        self.db = db
        self.xinfa_config = xinfa_config

    def get_character_by_name(self, user_id: int, name: str) -> List[Dict]:
        """根据角色名查询"""
        query = "SELECT * FROM characters WHERE user_id = %s AND name = %s"
        return self.db.execute_query(query, (user_id, name), fetchall=True)
    
    def get_character(self, user_id: int, name: str, xinfa:str) -> List[Dict]:
        """根据角色名和心法查询"""
        query = """
            SELECT * FROM characters 
            WHERE user_id = %s AND name = %s AND xinfa = %s
        """
        return self.db.execute_query(query, (user_id, name, xinfa), fetchone=True)

    def add_character(self, user_id: int, name: str, xinfa: str) -> None:
        """添加角色"""
        query = """
            INSERT INTO characters (user_id, name, server, xinfa)
            VALUES (%s, %s, '乾坤一掷', %s)
        """
        self.db.execute_query(query, (user_id, name, xinfa))
        self.db.commit_transaction()

    def try_parse_xinfa(self, xinfa: str) -> Optional[str]:
        """尝试解析心法名称"""
        for key, value in self.xinfa_config.items():
            if xinfa in value.get("nickname", []):
                return key
        return None

    def get_xinfa_name(self, xinfa: str) -> str:
        """获取心法名称"""
        if xinfa in self.xinfa_config:
            return self.xinfa_config[xinfa]["name"]
        raise ValueError(RET_MSG["K-无效心法"].format(xinfa=xinfa))

    def parse_xinfa(self, nickname: str) -> str:
        """从昵称解析心法"""
        xinfa = self.try_parse_xinfa(nickname)
        if xinfa:
            return xinfa
        raise ValueError(RET_MSG["K-无效心法"].format(xinfa=nickname))

class SignupHandlerBase:
    """报名处理基类"""
    def __init__(self, db: DatabaseHandler, xinfa_config: Dict):
        self.team_service = TeamService(db)
        self.character_service = CharacterService(db, xinfa_config)
        self.db = db

    # region 核心流程
    def process_command(self, member_openid: str, args: List[str]) -> str:
        """
        处理报名指令主流程
        1. 验证团队序号
        2. 解析剩余参数
        3. 执行报名逻辑
        """
        _log.debug("开始处理报名指令，用户ID: %s，参数: %s", member_openid, args)
        # 获取用户信息
        user_info = self._get_user_info(member_openid)
        _log.debug("获取到的用户信息: %s", user_info)
        
        # 步骤1：处理团队序号
        team_id, args = self._resolve_team_index(args)
        _log.debug("解析团队序号完成，团队ID: %s，剩余参数: %s", team_id, args)
        
        # 步骤2：解析业务参数
        signup_data = self.parse_arguments(user_info["user_id"], args)
        _log.debug("解析报名参数完成: %s", signup_data)
        
        # 步骤3：执行报名
        result = self.execute_signup(team_id, user_info, signup_data)
        _log.debug("报名处理完成，结果: %s", result)
        return result

    def _resolve_team_index(self, args: List[str]) -> Tuple[int, List[str]]:
        """
        解析团队序号逻辑：
        1. 检查是否有活跃团队
        2. 根据参数判断是否携带序号
        3. 返回团队ID和剩余参数
        """
        _log.debug("开始解析团队序号，参数: %s", args)
        active_teams = self.team_service.get_active_teams()
        _log.debug("获取到的活跃团队: %s", active_teams)

        if not active_teams:
            raise ValueError(RET_MSG["K-未开团"])

        if len(active_teams) == 1 and (not args or not args[0].isdigit()):
            if active_teams[0]["is_lock"]:
                raise ValueError(RET_MSG["K-团已锁"])
            return active_teams[0]["id"], args

        if not args or not args[0].isdigit():
            team_list = self._format_team_list(active_teams)
            raise ValueError(RET_MSG["K-未指定团号"].format(team_list=team_list))

        team_idx = int(args[0]) - 1
        if team_idx < 0 or team_idx >= len(active_teams):
            team_list = self._format_team_list(active_teams)
            raise ValueError(RET_MSG["K-无效团队序号"].format(team_idx=team_idx, team_list=team_list))

        _log.debug("团队序号解析完成，团队ID: %s，剩余参数: %s", active_teams[team_idx]["id"], args[1:])
        if active_teams[team_idx]["is_lock"]:
            raise ValueError(RET_MSG["K-团已锁"])
        return active_teams[team_idx]["id"], args[1:]

    def _format_team_list(self, teams: List[Dict]) -> str:
        """格式化团队列表"""
        return "\n".join(f"【{idx+1}】{team['title']}" for idx, team in enumerate(teams))
    # endregion

    # region 抽象方法
    def parse_arguments(self, user_id: int, args: List[str]) -> Dict:
        """解析参数（子类实现）"""
        raise NotImplementedError

    def execute_signup(self, team_id: int, user_info: Dict, signup_data: Dict) -> str:
        """执行报名逻辑（子类实现）"""
        raise NotImplementedError
    # endregion

    # region 公共方法
    def _get_user_info(self, member_openid: str) -> Dict:
        """获取用户信息"""
        _log.debug("开始获取用户信息，用户ID: %s", member_openid)
        query = """
            SELECT u.id AS user_id, u.qq_number, 
                   COALESCE(gm.group_nickname, u.nickname) AS nickname
            FROM bot_data bd
            JOIN users u ON bd.user_id = u.id
            LEFT JOIN guild_members gm ON bd.guild_id = gm.guild_id AND bd.user_id = gm.member_id
            WHERE bd.member_openid = %s
        """
        result = self.db.execute_query(query, (member_openid,), fetchone=True)
        if not result:
            raise ValueError(RET_MSG["K-未绑定"])
        _log.debug("获取到的用户信息: %s", result)
        return result

    def _create_signup_record(self, team_id: int, user_id: int, character: Dict, meta: Dict) -> str:
        """创建报名记录"""
        _log.info("开始创建报名记录，团队ID: %s，用户ID: %s，角色信息: %s，元信息: %s", 
                   team_id, user_id, character, meta)
        signup_info = {
            "submitName": meta["submit_name"],
            "signupName": meta["signup_name"],
            "characterName": character.get("name",""),
            "characterXinfa": character.get("xinfa"),
            "isLock": False
        }

        query = """
            INSERT INTO signups (team_id, submit_user_id, signup_user_id, signup_character_id, signup_info, priority, is_rich, is_proxy, client_type, lock_slot, is_dove)
            VALUES (%s, %s, %s, %s, %s, 0, %s, %s, '旗舰', NULL, FALSE)
        """
        self.db.execute_query(query, (team_id, user_id, meta.get("signup_user_id",0), character.get("id",0), 
                                      json.dumps(signup_info), meta.get("is_rich", False), meta.get("is_proxy", False)))
        self.db.commit_transaction()
        _log.info(f"报名成功 ，团队ID: {team_id}，用户ID: {user_id}，角色信息: {character}，元信息: {meta}")
        if meta.get("is_rich"):
            return RET_MSG["K-登记老板成功"]
        if meta.get("is_proxy"):
            return RET_MSG["K-代报名成功"]
        return RET_MSG["K-报名成功"]

    def cancel_signup(self, member_openid: str, args: List[str]) -> str:
        """
        取消报名功能：
        1. 验证团队序号
        2. 查询报名记录
        3. 根据用户输入取消指定记录
        """
        if len(args) < 1:
            raise ValueError(RET_MSG["K-取消报名格式错误"])

        team_idx = int(args[0])
        team_id = self._get_team_id_by_index(team_idx)
        args = args[1:]  # 移除第一个参数

        user_id = self._get_user_info(member_openid)["user_id"]
        query = """
            SELECT id, signup_info FROM signups 
            WHERE team_id = %s AND (submit_user_id = %s OR signup_user_id = %s) AND cancel_time IS NULL
        """
        results = self.db.execute_query(query, (team_id, user_id, user_id), fetchall=True)

        if not results:
            raise ValueError(RET_MSG["K-未报名"])

        if len(args) == 0:
            if len(results) == 1:
                return self._cancel_signup(results[0], user_id)
            else:
                return RET_MSG["K-多个报名记录"].format(
                    signup_list="\n".join(
                        f"【{idx+1}】. {self._format_signup_info(result['signup_info'])}"
                        for idx, result in enumerate(results)
                    )
                )

        elif len(args) == 1 and args[0].isdigit():
            idx = int(args[0]) - 1
            if idx < 0 or idx >= len(results):
                raise ValueError(RET_MSG["K-取消报名编号无效"].format(
                    signup_list="\n".join(
                        f"【{idx+1}】. {self._format_signup_info(result['signup_info'])}"
                        for idx, result in enumerate(results)
                    )
                ))
            return self._cancel_signup(results[idx], user_id)

        else:
            raise ValueError(RET_MSG["K-取消报名格式错误"])

    def _format_signup_info(self, signup_info: Dict) -> str:
        """格式化报名信息"""
        xinfa = self.character_service.get_xinfa_name(signup_info.get("characterXinfa"))
        signup_name = signup_info.get("signupName", "未知成员")
        submit_name = signup_info.get("submitName", "未知提交者")
        character_name = signup_info.get("characterName") or "未指定角色"
        name = signup_name
        if signup_name != submit_name:
            name = f"{signup_name}(由{submit_name}代报名)"
        
        return f"{character_name}({xinfa}) - {name}"

    def _cancel_signup(self, signup_info: Dict, user_id: int) -> str:
        """
        执行取消报名操作
        
        """
        signup_id = signup_info["id"]

        query = """
            UPDATE signups SET cancel_user_id = %s, cancel_time = %s WHERE id = %s
        """
        self.db.execute_query(query, (user_id, datetime.now(), signup_id))
        self.db.commit_transaction()
        _log.info(f"用户 {user_id} 成功取消报名：{signup_id}")
        return RET_MSG["K-取消报名成功"].format(signup_info=self._format_signup_info(signup_info['signup_info']))

    def _get_team_id_by_index(self, team_idx: int) -> int:
        """
        根据团队序号获取团队ID
        """
        active_teams = self.team_service.get_active_teams()
        if not active_teams:
            raise ValueError(RET_MSG["K-未开团"])
        if team_idx < 1 or team_idx > len(active_teams):
            team_list = self._format_team_list(active_teams)
            raise ValueError(RET_MSG["K-无效团队序号"].format(team_idx=team_idx, team_list=team_list))
        return active_teams[team_idx - 1]["id"]

    def _validate_name_length(self, name: str, field_name: str) -> None:
        """验证名称长度是否超过限制"""
        if len(name) > 6:
            raise ValueError(f"{field_name}不能超过6个汉字")
    # endregion

class NormalSignupHandler(SignupHandlerBase):
    """普通报名处理器"""
    def parse_arguments(self, user_id: int, args: List[str]) -> Dict:
        """
        解析报名参数：
        参数情况：
        1. [角色名] -> 精确匹配角色
        2. [心法名] -> 匹配心法对应角色
        3. [心法名 角色名] -> 创建/使用角色
        4. [角色名 心法名] -> 同上
        """
        _log.info("开始解析报名参数，用户ID: %s，参数: %s", user_id, args)
        if not args:
            raise ValueError(RET_MSG["K-报名格式错误"])
        
        # 参数解析逻辑
        if len(args) == 1:
            result = self._handle_single_argument(user_id, args[0])
            _log.debug("单参数解析结果: %s", result)
            return result
        elif len(args) == 2:
            result = self._handle_double_arguments(user_id, args)
            _log.debug("双参数解析结果: %s", result)
            return result
        else:
            raise ValueError(RET_MSG["K-报名格式错误"])

    def _handle_single_argument(self, user_id: int, arg: str) -> Dict:
        """处理单个参数情况"""
        # 先尝试匹配角色
        characters = self.character_service.get_character_by_name(user_id, arg)
        if len(characters) == 1:
            return characters[0]
        if len(characters) > 1:
            char_list = "\n".join(f"{c['name']}({c['xinfa']})" for c in characters)
            raise ValueError(RET_MSG["K-角色不明确"].format(character_list=char_list))
        xinfa = self.character_service.parse_xinfa(arg)
        return {"xinfa": xinfa, "name": None, "need_hint": True}

    def _handle_double_arguments(self, user_id: int, args: List[str]) -> Dict:
        """处理多参数情况"""
        if self.character_service.try_parse_xinfa(args[0]):
            xinfa = self.character_service.try_parse_xinfa(args[0])
            name = args[1]
        elif self.character_service.try_parse_xinfa(args[1]):
            xinfa = self.character_service.try_parse_xinfa(args[1])
            name = args[0]
        else:
            raise ValueError(RET_MSG["K-无效心法"].format(xinfa=args[0]))
        

        # 检查是否存在对应角色
        characters = self.character_service.get_character(user_id, name, xinfa)
        if characters:
            return characters[0]
        
        self._validate_name_length(name, "角色名")
        
        return {
            "xinfa": xinfa,
            "name": name,
            "need_create": True
        }

    def execute_signup(self, team_id: int, user_info: Dict, signup_data: Dict) -> str:
        """执行报名逻辑"""
        _log.info("开始执行报名，团队ID: %s，用户信息: %s，报名数据: %s", 
                   team_id, user_info, signup_data)
        meta = {
            "signup_name": user_info["nickname"],
            "submit_name": user_info["nickname"],
            "signup_user_id": user_info["user_id"],
        }
        
        character_data = {
            "id": signup_data.get("id"),
            "name": signup_data.get("name"),
            "xinfa": signup_data.get("xinfa")
        }

        # 检查当天团队未取消的报名记录
        query = """
            SELECT signup_character_id, submit_user_id, signup_user_id 
            FROM signups 
            WHERE team_id = %s AND cancel_time IS NULL
        """
        existing_signups = self.db.execute_query(query, (team_id,), fetchall=True)

        # 检查是否有同一角色重复报名（排除角色ID为0的情况）
        _log.debug("检查是否有同一角色重复报名，当前角色ID: %s, 记录列表: %s", character_data["id"], existing_signups)
        if character_data["id"] and character_data["id"] != 0 and any(
            record["signup_character_id"] == character_data["id"] for record in existing_signups
        ):
            raise ValueError("该角色已报名，不能重复报名！")

        # 检查当前提交人是否已有其他提交记录
        if any(
            record["submit_user_id"] == user_info["user_id"] or record["signup_user_id"] == user_info["user_id"]
            for record in existing_signups
        ):
            raise ValueError("不可重复报名，请选择代报名！")

        footnote = ""
        if signup_data.get("need_hint"):
            footnote = "\n" + RET_MSG["K-建议指明角色"]

        try:
            if signup_data.get("need_create"):
                self.character_service.add_character(user_info["user_id"], character_data["name"], character_data.get("xinfa"))
                res = self.character_service.get_character(user_info["user_id"], character_data["name"], character_data.get("xinfa"))
                if res:
                    character_data["id"] = res.get("id")
                    footnote += "\n" + RET_MSG["K-添加常用角色"].format(character_name=character_data["name"], 
                                                                  xinfa=self.character_service.get_xinfa_name(character_data["xinfa"]))
        except Exception as e:
            _log.warning("添加角色失败: %s", e)
        
        result = self._create_signup_record(team_id, user_info["user_id"], character_data, meta)
        _log.info("报名执行完成，结果: %s", result)
        return result + footnote

class ProxySignupHandler(SignupHandlerBase):
    """代报名处理器"""
    def parse_arguments(self, user_id: int, args: List[str]) -> Dict:
        """
        解析代报名参数：
        格式：/代报名 [团队序号] <参与人昵称> <心法名> [角色名]
        """
        _log.info("开始解析代报名参数，用户ID: %s，参数: %s", user_id, args)
        if len(args) < 2:
            raise ValueError(RET_MSG["K-代报名格式错误"])
        
        participant_name = args[0]
        xinfa = args[1]
        character_name = None
        if len(args) > 2:
            character_name = args[2]
            self._validate_name_length(character_name, "角色名")
        self._validate_name_length(participant_name, "参与人昵称")

        # 验证心法
        parsed_xinfa = self.character_service.try_parse_xinfa(xinfa)
        if not parsed_xinfa:
            raise ValueError(RET_MSG["K-无效心法"].format(xinfa=xinfa))

        return {
            "participant_name": participant_name,
            "xinfa": parsed_xinfa,
            "character_name": character_name
        }

    def execute_signup(self, team_id: int, user_info: Dict, signup_data: Dict) -> str:
        """执行代报名逻辑"""
        _log.info("开始执行代报名，团队ID: %s，用户信息: %s，报名数据: %s", 
                   team_id, user_info, signup_data)
        meta = {
            "signup_name": signup_data["participant_name"],
            "submit_name": user_info["nickname"],
            "signup_user_id": 0,  # 代报名不绑定具体用户
            "is_proxy": True
        }

        character_data = {
            "id": 0,  # 代报名不绑定具体角色
            "name": signup_data.get("character_name", ""),
            "xinfa": signup_data["xinfa"]
        }

        result = self._create_signup_record(team_id, user_info["user_id"], character_data, meta)
        _log.info("代报名执行完成，结果: %s", result)
        return result

class BossSignupHandler(SignupHandlerBase):
    """登记老板处理器"""
    def parse_arguments(self, user_id: int, args: List[str]) -> Dict:
        """
        解析登记老板参数：
        格式：/登记老板 [团队序号] <老板昵称> <心法名> [角色名]
        """
        _log.info("开始解析登记老板参数，用户ID: %s，参数: %s", user_id, args)
        if len(args) < 2:
            raise ValueError(RET_MSG["K-登记老板格式错误"])
        
        boss_name = args[0]
        xinfa = args[1]
        character_name = None
        if len(args) > 2:
            character_name = args[2]
            self._validate_name_length(character_name, "角色名")
        self._validate_name_length(boss_name, "老板昵称")

        # 验证心法
        parsed_xinfa = self.character_service.try_parse_xinfa(xinfa)
        if not parsed_xinfa:
            raise ValueError(RET_MSG["K-无效心法"].format(xinfa=xinfa))

        return {
            "boss_name": boss_name,
            "xinfa": parsed_xinfa,
            "character_name": character_name
        }

    def execute_signup(self, team_id: int, user_info: Dict, signup_data: Dict) -> str:
        """执行登记老板逻辑"""
        _log.info("开始执行登记老板，团队ID: %s，用户信息: %s，登记数据: %s", 
                   team_id, user_info, signup_data)
        meta = {
            "signup_name": signup_data["boss_name"],
            "submit_name": user_info["nickname"],
            "signup_user_id": 0,  # 登记老板不绑定具体用户
            "is_proxy": True  # 可复用代报名逻辑
        }

        character_data = {
            "id": 0,  # 登记老板不绑定具体角色
            "name": signup_data.get("character_name", ""),
            "xinfa": signup_data["xinfa"]
        }

        result = self._create_signup_record(team_id, user_info["user_id"], character_data, meta)
        _log.info("登记老板执行完成，结果: %s", result)
        return result
