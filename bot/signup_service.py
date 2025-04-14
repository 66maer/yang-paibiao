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
        return self.db.execute_query(query, (user_id, name), fetchall=True)  # 修改为 fetchall

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

    def signup(self, member_openid, args):
        if len(args) < 2:
            raise ValueError(f"参数错误，请检查输入格式。\n{self.get_signup_format_help()}")

        team_idx = int(args[0])
        team_id = self._get_team_id_by_index(team_idx)
        userinfo = self.get_user_info(member_openid)
        user_id = userinfo["user_id"]
        nickname = userinfo["group_nickname"] or userinfo["nickname"]  # 优先使用群昵称
        _log.info(f"昵称{nickname}，原始昵称{userinfo['nickname']}，群昵称{userinfo['group_nickname']}")
        args = args[1:]  # 移除第一个参数

        if len(args) == 1:
            name_or_xinfa = args[0]
            characters = self.get_character_by_name(user_id, name_or_xinfa)
            _log.info(f"用户 {user_id} 查询角色：{name_or_xinfa}")
            if len(characters) == 1:
                return self._create_signup(team_id, user_id, characters[0], {"signupName": nickname, "submitName": nickname})
            elif len(characters) > 1:
                raise ValueError(f"找到多个同名角色，请提供具体的角色名称：{[c['name'] for c in characters]}")
            
            xinfa = self.parse_xinfa(name_or_xinfa)
            characters = self.get_characters_by_xinfa(user_id, xinfa)
            if len(characters) == 1:
                return self._create_signup(team_id, user_id, characters[0], {"signupName": nickname, "submitName": nickname})
            elif len(characters) > 1:
                raise ValueError(f"找到多个角色，请提供具体的角色名称：{[c['name'] for c in characters]}")
            else:
                raise ValueError(f"未找到角色，请检查参数。\n{self.get_signup_format_help()}")

        elif len(args) == 2:
            name_or_xinfa, second_arg = args
            if self.is_rich_keyword(second_arg):
                characters = self.get_character_by_name(user_id, name_or_xinfa)
                if len(characters) == 1:
                    return self._create_signup(team_id, user_id, characters[0], {"signupName": nickname, "submitName": nickname, "isRich": True})
                elif len(characters) > 1:
                    raise ValueError(f"找到多个同名角色，请提供具体的角色名称：{[c['name'] for c in characters]}")
                
                xinfa = self.parse_xinfa(name_or_xinfa)
                characters = self.get_characters_by_xinfa(user_id, xinfa)
                if len(characters) == 1:
                    return self._create_signup(team_id, user_id, characters[0], {"signupName": nickname, "submitName": nickname, "isRich": True})
                elif len(characters) > 1:
                    raise ValueError(f"找到多个角色，请提供具体的角色名称：{[c['name'] for c in characters]}")
                else:
                    raise ValueError(f"未找到角色，请检查参数。\n{self.get_signup_format_help()}")
            else:
                xinfa = self.parse_xinfa(name_or_xinfa)
                character_name = second_arg
                return self._create_signup(team_id, user_id, {
                    "id": 0,
                    "name": None if character_name in ["?", "？"] else character_name,
                    "xinfa": xinfa
                }, {"signupName": nickname, "submitName": nickname})

        elif len(args) == 3:
            xinfa_nickname, character_name, third_arg = args
            xinfa = self.parse_xinfa(xinfa_nickname)
            is_rich = self.is_rich_keyword(third_arg)
            return self._create_signup(team_id, user_id, {
                "id": 0,
                "name": None if character_name in ["?", "？"] else character_name,
                "xinfa": xinfa
            }, {"signupName": nickname, "submitName": nickname, "isRich": is_rich})

        else:
            raise ValueError(f"参数错误，请检查输入格式。\n{self.get_signup_format_help()}")

    def proxy_signup(self, member_openid, args):
        if len(args) < 4 or len(args) > 5:
            raise ValueError(f"参数错误，请检查输入格式。\n{self.get_proxy_signup_format_help()}")

        team_idx = int(args[0])
        team_id = self._get_team_id_by_index(team_idx)
        args = args[1:]  # 移除第一个参数

        signup_name, xinfa_nickname, character_name = args[:3]
        is_rich = len(args) == 4 and self.is_rich_keyword(args[3])
        xinfa = self.parse_xinfa(xinfa_nickname)
        return self._create_signup(team_id, self.get_user_info(member_openid)["user_id"], {
            "id": 0,
            "name": None if character_name in ["?", "？"] else character_name,
            "xinfa": xinfa
        }, {"signupName": signup_name, "submitName": signup_name, "isRich": is_rich})

    def cancel_signup(self, member_openid, args):
        if len(args) < 1:
            raise ValueError("参数错误，请提供团队序号。")

        team_idx = int(args[0])
        team_id = self._get_team_id_by_index(team_idx)
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

    def _get_team_id_by_index(self, index):
        query = """
            SELECT id FROM teams WHERE close_time IS NULL AND is_hidden = FALSE ORDER BY team_time
        """
        results = self.db.execute_query(query, fetchall=True)
        if not results or index < 1 or index > len(results):
            raise ValueError("无效的团队序号。")
        return results[index - 1]["id"]

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
