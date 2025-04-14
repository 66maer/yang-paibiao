import json
from db_handler import DatabaseHandler
from botpy import logging

_log = logging.get_logger()

class PersonalizationService:
    def __init__(self):
        self.db = DatabaseHandler()
        with open("xinfa_config.json", "r") as xinfa_file:
            self.xinfa_config = json.load(xinfa_file)  # 加载心法配置

    def add_character(self, member_openid, args):
        """
        添加角色
        """
        if len(args) != 2:
            raise ValueError("参数错误，请使用正确格式：/添加角色 心法名 角色名")

        xinfa_input, name = args
        xinfa = self._get_standard_xinfa_name(xinfa_input)  # 获取标准心法名称
        user_info = self._get_user_info(member_openid)
        user_id = user_info["user_id"]

        # 检查角色是否已存在
        query = """
            SELECT * FROM characters WHERE user_id = %s AND name = %s
        """
        result = self.db.execute_query(query, (user_id, name), fetchone=True)
        if result:
            raise ValueError(f"角色 {name} 已存在。")

        # 插入角色
        insert_query = """
            INSERT INTO characters (user_id, name, server, xinfa)
            VALUES (%s, %s, '乾坤一掷', %s)
        """
        self.db.execute_query(insert_query, (user_id, name, xinfa))
        self.db.commit_transaction()
        _log.info(f"用户 {user_id} 成功添加角色：{name}，心法：{xinfa}")
        return f"角色 {name} 添加成功！"

    def update_group_nickname(self, member_openid, args):
        """
        修改群昵称
        """
        if len(args) != 1:
            raise ValueError("参数错误，请使用正确格式：/修改昵称 新昵称")

        new_nickname = args[0]
        user_info = self._get_user_info(member_openid)
        user_id = user_info["user_id"]
        guild_id = user_info["guild_id"]

        # 更新群昵称
        update_query = """
            UPDATE guild_members
            SET group_nickname = %s
            WHERE guild_id = %s AND member_id = %s
        """
        self.db.execute_query(update_query, (new_nickname, guild_id, user_id))
        self.db.commit_transaction()
        _log.info(f"用户 {user_id} 成功修改群昵称为：{new_nickname}")
        return f"群昵称修改成功，新昵称：{new_nickname}"

    def _get_user_info(self, member_openid):
        """
        获取用户信息
        """
        query = """
            SELECT u.id AS user_id, gm.guild_id AS guild_id
            FROM bot_data bd
            JOIN users u ON bd.user_id = u.id
            JOIN guild_members gm ON bd.guild_id = gm.guild_id AND bd.user_id = gm.member_id
            WHERE bd.member_openid = %s
        """
        result = self.db.execute_query(query, (member_openid,), fetchone=True)
        if not result:
            raise ValueError("请先绑定QQ号。")
        return result

    def _get_standard_xinfa_name(self, xinfa_input):
        """
        根据输入的心法名称获取标准名称
        """
        for xinfa, info in self.xinfa_config.items():
            if xinfa_input in info["nickname"]:
                return xinfa  # 返回配置中的 key 作为标准名称
        raise ValueError(f"无效的心法名称：{xinfa_input}，请检查输入。")
