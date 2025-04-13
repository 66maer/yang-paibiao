import botpy
from botpy import logging
from botpy.message import Message
from botpy.http import Route
import yaml
from qq_binding import QQBindingService
from team_board import TeamBoardService
from signup_service import SignupService
from personalization_service import PersonalizationService 
_log = logging.get_logger()

from botpy.logging import configure_logging, DEFAULT_FILE_HANDLER

# 配置日志输出目录
log_directory = "logs"
custom_file_handler = DEFAULT_FILE_HANDLER.copy()
custom_file_handler["filename"] = f"{log_directory}/xiaoyang-bot.log"

# 调用 configure_logging 配置日志
configure_logging(ext_handlers=custom_file_handler)

async def post_group_base64file(message: Message, group_openid: str, file_type: int, file_data: str, srv_send_msg: bool = False):
    """
    上传/发送群聊图片
    Args:
      group_openid (str): 您要将消息发送到的群的 ID
      file_type (int): 媒体类型：1 图片png/jpg，2 视频mp4，3 语音silk，4 文件（暂不开放）
      file_data (str): 二进制文件的base64编码，可用于代替网络url资源，实现本地上传文件
      srv_send_msg (bool): 设置 true 会直接发送消息到目标端，且会占用主动消息频次
    """
    payload = {
        "group_openid": group_openid,
        "file_type": file_type,
        "file_data": file_data,
        "srv_send_msg": srv_send_msg,
    }
    route = Route("POST", "/v2/groups/{group_openid}/files", group_openid=group_openid)
    return await message._api._http.request(route, json=payload)


async def handle_command(message: Message):
    content = message.content
    member_openid = message.author.member_openid

    # 处理指令
    # 拆分指令和参数
    command_parts = content.split()
    command = command_parts[0]
    args = command_parts[1:]
    if command == "/开团看板":
        service = TeamBoardService()
        try:
            response, msg_type = await service.handle_team_board_command(args)
            if msg_type == 1:
                # 处理文本消息
                await message.reply(content=response)
            elif msg_type == 2:
                # 直接发送图片的Base64数据
                upload_media = await post_group_base64file(
                    message,
                    group_openid=message.group_openid,
                    file_type=1,
                    file_data=response,
                )
                await message.reply(
                    msg_type=7,
                    media=upload_media,
                )
        except ValueError as e:
            await message.reply(content=str(e))
    elif command == "/报名":
        service = SignupService()
        try:
            response = service.signup(member_openid, args)
            await message.reply(content=response)
        except ValueError as e:
            await message.reply(content=str(e))
    elif command == "/代报名":
        service = SignupService()
        try:
            response = service.proxy_signup(member_openid, args)
            await message.reply(content=response)
        except ValueError as e:
            await message.reply(content=str(e))
    elif command == "/取消报名":
        service = SignupService()
        try:
            response = service.cancel_signup(member_openid, args)
            await message.reply(content=response)
        except ValueError as e:
            await message.reply(content=str(e))
    elif command == "/添加角色":
        service = PersonalizationService()
        try:
            response = service.add_character(member_openid, args)
            await message.reply(content=response)
        except ValueError as e:
            await message.reply(content=str(e))
    elif command == "/修改昵称":
        service = PersonalizationService()
        try:
            response = service.update_group_nickname(member_openid, args)
            await message.reply(content=response)
        except ValueError as e:
            await message.reply(content=str(e))
    elif command == "/绑定QQ号":
        service = QQBindingService()
        try:
            response = service.bind_qq(member_openid, args)
            await message.reply(content=response)
        except ValueError as e:
            await message.reply(content=str(e))
    elif command == "/使用说明":
        commands = [
            "/开团看板 [序号] - 查看开团信息或详细信息",
            "/报名 <团队序号> <角色名|心法名> [老板] - 报名参加团队",
            "/报名 <团队序号> <心法名> <角色名> [老板] - 报名参加团队",
            "/代报名 <团队序号> <参与人昵称> <心法名> <角色名> [老板] - 代他人报名",
            "/取消报名 <团队序号> [编号] - 取消报名",
            "/添加角色 <心法名> <角色名> - 添加新角色",
            "/修改昵称 <新昵称> - 修改群昵称",
            "/绑定QQ号 <QQ号> <昵称> - 绑定QQ号",
            "/绑定QQ号 验证码 - 验证绑定",
            "/绑定QQ号 重新绑定 <QQ号> <昵称> - 重新绑定QQ号",
            "/使用说明 - 查看指令使用说明",
        ]
        usage_guide = "可用指令列表：\n"
        for i, cmd in enumerate(commands, start=1):
            usage_guide += f"{i}. {cmd}\n"
        await message.reply(content=usage_guide)
    else:
        await message.reply(content="未知指令")
        return


class MyClient(botpy.Client):
    def __init__(self, intents, config):
        super().__init__(intents=intents, is_sandbox=config["qqbot"]["is_sandbox"])
        self.appid = config["qqbot"]["appid"]
        self.secret = config["qqbot"]["secret"]

    async def on_group_at_message_create(self, message: Message):
        message.content = message.content.strip()  # 去除首尾空格
        if message.content.startswith("/"):
            await handle_command(message)
        else:
            await message.reply(content="请以 / 开头的指令进行操作。")
            


with open("config.yaml", "r") as config_file:
    config = yaml.safe_load(config_file)

intents = botpy.Intents(public_messages=True)
client = MyClient(intents=intents, config=config)
client.run(appid=config["qqbot"]["appid"], secret=config["qqbot"]["secret"])