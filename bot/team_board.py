import base64
import os
import time
from db_handler import DatabaseHandler
from botpy import logging
import json
from pyppeteer import launch
import yaml

_log = logging.get_logger()

class TeamBoardService:
    def __init__(self, db: DatabaseHandler):
        self.db = db
        self.last_call_times = {}  # 使用字典存储每个团队的最后调用时间
        self.call_cd = 15  # 调用间隔时间
        with open("config.yaml", "r") as config_file:
            config = yaml.safe_load(config_file)
        client_config = config["client"]
        self.host_url = client_config["host_url"]

    def clean_expired_call_times(self):
        """
        清理 last_call_times 中超过缓存过期时间的条目。
        """
        current_time = time.time()
        expired_keys = [team_id for team_id, last_time in self.last_call_times.items()
                        if current_time - last_time > 2 * self.call_cd]
        for key in expired_keys:
            del self.last_call_times[key]
        if expired_keys:
            _log.info(f"清理过期的调用时间缓存：{expired_keys}")

    async def get_open_teams(self):
        """
        查询所有未关闭且未隐藏的开团信息，按时间排序。
        """
        query = """
            SELECT id, title, is_lock
            FROM teams 
            WHERE close_time IS NULL AND is_hidden = FALSE
            ORDER BY team_time
        """
        results = self.db.execute_query(query, fetchall=True)
        if not results:
            _log.info("没有未关闭的开团信息。")
            return "还没有开团，别急，尊重夕阳红命运...", 1
        
        # 如果只有一条数据，返回详细信息
        if len(results) == 1:
            team = results[0]
            return await self.get_team_details(1)

        response = "\n".join([f"\n【{idx + 1}】. {'[锁]' if team['is_lock'] else ''}{team['title']}" for idx, team in enumerate(results)])
        _log.info(f"查找到 {len(results)} 个开团信息：{response}")
        return response, 1

    async def get_team_details(self, idx):
        """
        根据序号获取开团的详细信息，并返回图片的Base64编码。
        """
        query = """
            SELECT id, title, team_time, dungeons, notice, book_xuanjing, book_yuntie, 
                   is_lock, rule, create_time, update_time, 
                   (SELECT nickname FROM users WHERE id = teams.creater_id) AS creater_nickname
            FROM teams 
            WHERE close_time IS NULL AND is_hidden = FALSE
            ORDER BY team_time
        """
        results = self.db.execute_query(query, fetchall=True)
        if not results or idx < 1 or idx > len(results):
            _log.warning(f"无效的序号：{idx}")
            raise ValueError("无效的序号。")
        
        team = results[idx - 1]
        team_id = team["id"]

        current_time = time.time()
        if team_id in self.last_call_times and current_time - self.last_call_times[team_id] < self.call_cd:
            _log.warning(f"面板详情调用频率过快，团队ID：{team_id}")
            remaining_time = self.call_cd - (current_time - self.last_call_times[team_id])
            raise ValueError(f"尚在调息之中，静待片刻方可。(剩余{remaining_time:.1f}秒)")

        self.last_call_times[team_id] = current_time  # 更新该团队的最后调用时间

        details = {
            "id": team["id"],
            "title": team["title"],
            "teamTime": team["team_time"].strftime("%Y-%m-%dT%H:%M:%SZ"),
            "dungeons": team["dungeons"],
            "notice": team["notice"],
            "bookXuanjing": team["book_xuanjing"],
            "bookYuntie": team["book_yuntie"],
            "isLock": team["is_lock"],
            "rules": team["rule"],
            "createTime": team["create_time"].strftime("%Y-%m-%dT%H:%M:%SZ"),
            "updateTime": team["update_time"].strftime("%Y-%m-%dT%H:%M:%SZ"),
            "createrNickname": team["creater_nickname"]
        }

        # 获取报名者信息
        signup_query = """
            SELECT s.id, s.submit_user_id, s.signup_user_id, s.signup_character_id, 
                   s.signup_info, s.priority, s.is_rich, s.is_proxy, s.client_type, 
                   s.lock_slot, 
                   gm.group_nickname AS submit_group_nickname, 
                   u.nickname AS submit_nickname, 
                   gms.group_nickname AS signup_group_nickname, 
                   su.nickname AS signup_nickname, 
                   c.name AS character_name, c.xinfa AS character_xinfa
            FROM signups s
            LEFT JOIN users u ON s.submit_user_id = u.id
            LEFT JOIN teams t ON s.team_id = t.id
            LEFT JOIN guild_members gm ON t.guild_id = gm.guild_id AND s.submit_user_id = gm.member_id
            LEFT JOIN users su ON s.signup_user_id = su.id
            LEFT JOIN guild_members gms ON t.guild_id = gms.guild_id AND s.signup_user_id = gms.member_id
            LEFT JOIN characters c ON s.signup_character_id = c.id
            WHERE s.team_id = %s AND s.cancel_time IS NULL
        """
        signup_results = self.db.execute_query(signup_query, (team["id"],), fetchall=True)

        signups = []
        for signup in signup_results:
            submit_name = signup["submit_group_nickname"] or signup["submit_nickname"] or "未知"
            signup_name = signup["signup_group_nickname"] or signup["signup_nickname"] or None
            signup_info = signup["signup_info"]
            signups.append({
                "signupId": signup["id"],
                "submitUserId": signup["submit_user_id"],
                "submitName": submit_name,
                "signupUserId": signup["signup_user_id"],
                "signupName": signup_name or signup_info.get("signupName", "未知"),
                "signupCharacterId": signup["signup_character_id"],
                "characterName": signup["character_name"] or signup_info.get("characterName", "未知"),
                "characterXinfa": signup["character_xinfa"] or signup_info.get("characterXinfa", "未知"),
                "priority": signup["priority"],
                "isRich": signup["is_rich"],
                "isProxy": signup["is_proxy"],
                "clientType": signup["client_type"],
                "isLock": signup_info.get("isLock", False),
                "lockSlot": signup["lock_slot"]
            })

        details["signups"] = signups

        json_details = json.dumps(details)
        encoded_details = base64.b64encode(json_details.encode("utf-8")).decode("utf-8")
        _log.debug(f"成功获取开团详细信息并编码为Base64：{json_details}")
        
        # 检查缓存是否存在
        cache_path = f'cache/{team["id"]}.png'
        cache_data_path = f'cache/{team["id"]}.b64'
        if os.path.exists(cache_path) and os.path.exists(cache_data_path):
            with open(cache_data_path, "r") as f:
                cached_data = f.read()
            if cached_data == encoded_details:
                _log.info(f"缓存匹配，直接返回缓存图片的Base64数据：{cache_path}")
                with open(cache_path, "rb") as image_file:
                    return base64.b64encode(image_file.read()).decode("utf-8"), 2

        # 保存Base64数据并生成截图
        await self.generate_screenshot(team["id"], encoded_details)
        with open(cache_data_path, "w") as f:
            f.write(encoded_details)
        with open(cache_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode("utf-8"), 2

    async def generate_screenshot(self, id, encoded_details):
        """
        生成开团看板的截图。
        """
        # 启动无头浏览器
        browser = await launch(
            executablePath='/usr/bin/google-chrome-unstable',
            headless=True, args=['--no-sandbox', '--disable-gpu'],
            dumpio=True  # 输出调试信息
        )
        page = await browser.newPage()

        # 访问React组件的路由
        url = f'http://{self.host_url}/screenshot'
        await page.goto(url, {'waitUntil': 'networkidle0'})

        # 使用 POST 请求传递数据
        await page.evaluate('''(data) => {
            localStorage.setItem('screenshotData', data);
        }''', encoded_details)

        await page.reload({'waitUntil': 'networkidle0'})

        # 截图并保存
        await page.screenshot({'path': f'cache/{id}.png', 'fullPage': True})
        await browser.close()
        _log.info(f"成功生成截图：{id}.png")

    def clean_old_cache(self):
        """
        清理当天 0 点之前的缓存图片和 Base64 数据。
        """
        cache_dir = "cache"
        # 获取当天 0 点的时间戳
        current_time = time.time()
        zero_time = current_time - (current_time % (24 * 60 * 60))
        for filename in os.listdir(cache_dir):
            file_path = os.path.join(cache_dir, filename)
            if os.path.isfile(file_path) and os.path.getmtime(file_path) < zero_time:
                os.remove(file_path)
                _log.info(f"已清理缓存文件：{file_path}")

    async def handle_team_board_command(self, args):
        """
        统一处理开团看板指令的入口。
        """
        # 清理旧缓存
        self.clean_old_cache()
        self.clean_expired_call_times()  # 清理过期的调用时间缓存
        if len(args) == 0:
            return await self.get_open_teams()
        elif len(args) == 1 and args[0].isdigit():
            idx = int(args[0])
            return await self.get_team_details(idx)
        else:
            _log.warning(f"参数格式错误：{args}")
            raise ValueError("参数格式错误。")
