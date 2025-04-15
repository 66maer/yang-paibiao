import json
from datetime import datetime
from db_handler import DatabaseHandler
from botpy import logging
import yaml

_log = logging.get_logger()

class SignupService:
    def __init__(self):
        self.db = DatabaseHandler()
        with open("xinfa_config.json", "r") as xinfa_file:
            self.xinfa_config = json.load(xinfa_file)

    def get_user_info(self, member_openid):
        _log.info(f"获取用户信息，member_openid: {member_openid}")
        query = """
            SELECT u.id AS user_id, 
                   u.qq_number AS qq_number,
                   u.nickname AS nickname,
                   gm.group_nickname AS group_nickname
            FROM bot_data bd
            JOIN users u ON bd.user_id = u.id
            LEFT JOIN guild_members gm ON bd.guild_id = gm.guild_id AND bd.user_id = gm.member_id
            WHERE bd.member_openid = %s
        """
        result = self.db.execute_query(query, (member_openid,), fetchone=True)
        if not result:
            raise ValueError("请先绑定QQ号。")
        return result

    def get_character_by_name(self, user_id, name):
        query = """
            SELECT * FROM characters WHERE user_id = %s AND name = %s
        """
        return self.db.execute_query(query, (user_id, name), fetchall=True)

    def get_characters_by_xinfa(self, user_id, xinfa):
        query = """
            SELECT * FROM characters WHERE user_id = %s AND xinfa = %s
        """
        return self.db.execute_query(query, (user_id, xinfa), fetchall=True)

    def parse_xinfa(self, nickname):
        for xinfa, info in self.xinfa_config.items():
            if nickname in info["nickname"]:
                return xinfa
        raise ValueError("参数错误，请提供正确的心法昵称。")

    def is_rich_keyword(self, keyword):
        return keyword in ["老板", "躺", "躺拍", "躺尸", "躺地板"]

    def get_signup_format_help(self):
        return (
            "正确格式：\n"
            "1. /报名 <团队序号> <角色名|心法名> [老板]\n"
            "2. /报名 <团队序号> <心法名> <角色名> [老板]"
        )

    def get_proxy_signup_format_help(self):
        return (
            "正确格式：\n"
            "/代报名 <团队序号> <参与人昵称> <心法名> <角色名> [老板]"
        )

    def _get_active_teams(self):
        query = """
            SELECT id, title FROM teams WHERE close_time IS NULL AND is_hidden = FALSE ORDER BY team_time
        """
        return self.db.execute_query(query, fetchall=True)

    def _validate_team(self, team_idx):
        teams = self._get_active_teams()
        if not teams:
            raise ValueError("当前没有活跃的团队，无法报名。")
        if len(teams) == 1:
            if team_idx is None or team_idx == 1:
                return teams[0]["id"]
            else:
                raise ValueError(f"没有找到标号为 {team_idx} 的团队。\n当前团队列表：\n" +
                                 "\n".join([f"【1】. {teams[0]['title']}"]))
        if team_idx is None or not isinstance(team_idx, int):
            raise ValueError("有多个团队，请指定团队序号。\n当前团队列表：\n" +
                             "\n".join([f"【{idx + 1}】. {team['title']}" for idx, team in enumerate(teams)]))
        if team_idx < 1 or team_idx > len(teams):
            raise ValueError(f"团队标号无效。\n当前团队列表：\n" +
                             "\n".join([f"【{idx + 1}】. {team['title']}" for idx, team in enumerate(teams)]))
        return teams[team_idx - 1]["id"]

    def _get_character(self, user_id, name_or_xinfa):
        characters = self.get_character_by_name(user_id, name_or_xinfa)
        if characters:
            if len(characters) == 1:
                return characters[0]
            raise ValueError(f"找到多个同名角色，请提供具体的角色名称：{[c['name'] for c in characters]}")
        xinfa = self.parse_xinfa(name_or_xinfa)
        characters = self.get_characters_by_xinfa(user_id, xinfa)
        if characters:
            if len(characters) == 1:
                return characters[0]
            raise ValueError(f"找到多个角色，请提供具体的角色名称：{[c['name'] for c in characters]}")
        return {"id": 0, "name": None, "xinfa": xinfa}

    def _handle_signup(self, team_id, user_id, nickname, args, is_proxy=False, proxy_name=None):
        if len(args) == 1:
            character = self._get_character(user_id, args[0])
            return self._create_signup(team_id, user_id, character, {
                "signupName": proxy_name or nickname,
                "submitName": nickname,
                "isRich": False,
                "isProxy": is_proxy
            })
        elif len(args) == 2:
            if self.is_rich_keyword(args[1]):
                character = self._get_character(user_id, args[0])
                return self._create_signup(team_id, user_id, character, {
                    "signupName": proxy_name or nickname,
                    "submitName": nickname,
                    "isRich": True,
                    "isProxy": is_proxy
                })
            xinfa = self.parse_xinfa(args[0])
            character_name = args[1]
            return self._create_signup(team_id, user_id, {
                "id": 0,
                "name": None if character_name in ["?", "？"] else character_name,
                "xinfa": xinfa
            }, {
                "signupName": proxy_name or nickname,
                "submitName": nickname,
                "isRich": False,
                "isProxy": is_proxy
            })
        elif len(args) == 3:
            xinfa = self.parse_xinfa(args[0])
            character_name = args[1]
            is_rich = self.is_rich_keyword(args[2])
            return self._create_signup(team_id, user_id, {
                "id": 0,
                "name": None if character_name in ["?", "？"] else character_name,
                "xinfa": xinfa
            }, {
                "signupName": proxy_name or nickname,
                "submitName": nickname,
                "isRich": is_rich,
                "isProxy": is_proxy
            })
        else:
            raise ValueError(f"参数错误，请检查输入格式。\n{self.get_signup_format_help()}")

    def signup(self, member_openid, args):
        if len(args) < 1:
            raise ValueError(f"参数错误，请检查输入格式。\n{self.get_signup_format_help()}")
        team_idx = int(args[0]) if args[0].isdigit() else None
        team_id = self._validate_team(team_idx)
        userinfo = self.get_user_info(member_openid)
        user_id = userinfo["user_id"]
        nickname = userinfo["group_nickname"] or userinfo["nickname"]
        args = args[1:] if team_idx else args
        return self._handle_signup(team_id, user_id, nickname, args)

    def proxy_signup(self, member_openid, args):
        if len(args) < 4:
            raise ValueError(f"参数错误，请检查输入格式。\n{self.get_proxy_signup_format_help()}")
        team_idx = int(args[0]) if args[0].isdigit() else None
        team_id = self._validate_team(team_idx)
        userinfo = self.get_user_info(member_openid)
        user_id = userinfo["user_id"]
        nickname = userinfo["group_nickname"] or userinfo["nickname"]
        proxy_name = args[1]
        return self._handle_signup(team_id, user_id, nickname, args[2:], is_proxy=True, proxy_name=proxy_name)

    def register_rich(self, member_openid, args):
        if len(args) < 4:
            raise ValueError("参数错误，请检查输入格式。")
        return self.proxy_signup(member_openid, args)

    def cancel_signup(self, member_openid, args):
        if len(args) < 1:
            raise ValueError("参数错误，请提供团队序号。")

        team_idx = int(args[0])
        team_id = self._validate_team(team_idx)
        args = args[1:]  # 移除第一个参数

        user_id = self.get_user_info(member_openid)["user_id"]
        query = """
            SELECT id, signup_info FROM signups WHERE team_id = %s AND (submit_user_id = %s OR signup_user_id = %s) AND cancel_time IS NULL
        """
        results = self.db.execute_query(query, (team_id, user_id, user_id), fetchall=True)

        if not results:
            raise ValueError("未找到可取消的报名记录。")

        if len(args) == 0:
            if len(results) == 1:
                return self._cancel_signup(results[0]["id"], user_id)
            else:
                return f"找到多个报名记录，请提供编号取消：\n" + "\n".join([f"{idx + 1}. {r['signup_info']}" for idx, r in enumerate(results)])

        elif len(args) == 1 and args[0].isdigit():
            idx = int(args[0]) - 1
            if idx < 0 or idx >= len(results):
                raise ValueError("编号无效。")
            return self._cancel_signup(results[idx]["id"], user_id)

        else:
            raise ValueError("参数错误，请检查输入格式。")

    def _create_signup(self, team_id, user_id, character, userinfo):
        signup_info = {
            "characterName": character["name"] or "未知",
            "characterXinfa": character.get("xinfa", "未知"),
            "isLock": False,
            "isRich": userinfo.get("isRich", False),
            "signupName": userinfo["signupName"],
            "submitName": userinfo["submitName"]
        }
        query = """
            INSERT INTO signups (team_id, submit_user_id, signup_user_id, signup_character_id, signup_info, priority, is_rich, is_proxy, client_type, lock_slot, is_dove)
            VALUES (%s, %s, %s, %s, %s, 0, %s, FALSE, 'web', NULL, FALSE)
        """
        self.db.execute_query(query, (team_id, user_id, user_id, character["id"], json.dumps(signup_info), signup_info["isRich"]))
        self.db.commit_transaction()
        _log.info(f"用户 {user_id} 成功报名：{signup_info}")
        return "报名成功！"

    def _cancel_signup(self, signup_id, user_id):
        query = """
            UPDATE signups SET cancel_user_id = %s, cancel_time = %s WHERE id = %s
        """
        self.db.execute_query(query, (user_id, datetime.now(), signup_id))
        self.db.commit_transaction()
        _log.info(f"用户 {user_id} 成功取消报名：{signup_id}")
        return "取消报名成功！"
