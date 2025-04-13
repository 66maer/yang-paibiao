import random
import smtplib
from email.mime.text import MIMEText
from datetime import datetime, timedelta
import time
from db_handler import DatabaseHandler
import yaml
from botpy import logging

_log = logging.get_logger()

class QQBindingService:
    def __init__(self):
        self.db = DatabaseHandler()
        with open("config.yaml", "r") as config_file:
            config = yaml.safe_load(config_file)
        self.smtp_server = "smtp.qq.com"
        self.smtp_port = 587
        self.smtp_user = config["email"]["user"]
        self.smtp_password = config["email"]["password"]

    def generate_verification_code(self):
        return ''.join(random.choices("0123456789", k=6))

    def send_verification_email(self, email, code, is_rebind=False):
        action = "重新绑定" if is_rebind else "绑定"
        msg = MIMEText(f"您的{action}验证码是：{code}，有效期为10分钟。")
        msg['Subject'] = f"【小秧】QQ{action}验证码"
        msg['From'] = self.smtp_user
        msg['To'] = email

        try:
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.set_debuglevel(1)
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.sendmail(self.smtp_user, email, msg.as_string())
                server.quit() 
                _log.info(f"验证码邮件已成功发送至 {email}。")
        except smtplib.SMTPException as e:
            _log.error(f"发送验证码邮件至 {email} 时发生SMTP错误: {e}")
            raise ValueError("邮件发送失败，请稍后重试。")
        except Exception as e:
            _log.error(f"发送验证码邮件至 {email} 时发生未知错误: {e}")
            raise ValueError("邮件发送失败，请稍后重试。")

    def delete_expired_verification_codes(self):
        """
        删除所有过期的验证码记录。
        """
        delete_query = """
            DELETE FROM verification_codes 
            WHERE expire_time <= %s
        """
        self.db.execute_query(delete_query, (datetime.now(),))
        _log.info("已删除所有过期的验证码记录。")

    def bind_qq(self, member_openid, args):
        if len(args) == 0:
            _log.info(f"用户 {member_openid} 请求绑定QQ号，但未提供参数。")
            return "使用说明：\n1. 【初次绑定】：/绑定QQ号 QQ号 昵称\n2. 【邮件验证】：/绑定QQ号 验证码\n3. 【重新绑定】：/绑定QQ号 重新绑定 QQ号 昵称"

        if len(args) == 2 and args[0].isdigit():
            qq_number, nickname = args
            _log.info(f"用户 {member_openid} 请求绑定QQ号 {qq_number}，昵称为 {nickname}。")
            # 检查是否已绑定
            query = """
                SELECT * FROM bot_data 
                WHERE member_openid = %s OR qq_number = %s
            """
            result = self.db.execute_query(query, (member_openid, qq_number), fetchone=True)
            if result:
                _log.warning(f"绑定失败：用户 {member_openid} 或 QQ号 {qq_number} 已绑定过。")
                raise ValueError("该QQ号或用户已绑定过。")

            try:
                # 删除所有过期记录
                self.delete_expired_verification_codes()

                # 生成验证码并尝试插入
                code = None
                for _ in range(15):
                    code = self.generate_verification_code()
                    try:
                        expire_time = datetime.now() + timedelta(minutes=10)
                        insert_query = """
                            INSERT INTO verification_codes (qq_number, nickname, code, expire_time, is_rebind)
                            VALUES (%s, %s, %s, %s, FALSE)
                        """
                        self.db.execute_query(insert_query, (qq_number, nickname, code, expire_time))
                        _log.info(f"验证码 {code} 为 QQ号 {qq_number} 生成成功。")
                        break
                    except Exception as e:
                        _log.warning(f"验证码插入失败，尝试重新生成: {e}")
                else:
                    _log.error(f"用户 {member_openid} 绑定QQ号 {qq_number} 时生成验证码失败。")
                    raise ValueError("生成验证码失败，请稍后重试。")

                # 提交事务
                self.db.commit_transaction()
                _log.info(f"用户 {member_openid} 成功为 QQ号 {qq_number} 生成验证码并提交事务。")

                # 发送邮件
                self.send_verification_email(f"{qq_number}@qq.com", code)
                _log.info(f"验证码邮件已发送至 {qq_number}@qq.com。")
                return "验证码已发送，请查收邮件。"
            except Exception as e:
                self.db.rollback_transaction()
                _log.error(f"绑定QQ号时发生错误: {e}")
                raise ValueError("绑定失败，请稍后重试。")

        elif len(args) == 1 and args[0].isdigit():
            code = args[0]
            _log.info(f"用户 {member_openid} 请求验证验证码 {code}。")
            # 验证记录
            query = """
                SELECT * FROM verification_codes 
                WHERE code = %s AND expire_time > %s
            """
            result = self.db.execute_query(query, (code, datetime.now()), fetchone=True)
            if not result:
                _log.warning(f"验证码 {code} 无效或已过期。")
                raise ValueError("验证码无效或已过期。")

            qq_number, nickname, is_rebind = result["qq_number"], result["nickname"], result["is_rebind"]
            _log.info(f"验证码 {code} 验证成功，QQ号 {qq_number}，昵称 {nickname}，是否重新绑定：{is_rebind}。")

            try:
                if not is_rebind:
                    # 创建用户
                    insert_user_query = """
                        INSERT INTO users (qq_number, password, nickname)
                        VALUES (%s, %s, %s)
                        RETURNING id
                    """
                    user_id = self.db.execute_query(insert_user_query, (qq_number, "123456", nickname), fetchone=True)["id"]
                    _log.info(f"用户 {user_id} 创建成功，QQ号 {qq_number}，昵称 {nickname}。")

                    # 添加到群组
                    insert_guild_member_query = """
                        INSERT INTO guild_members (guild_id, member_id, role, group_nickname)
                        VALUES (1, %s, 'member',%s)
                    """
                    self.db.execute_query(insert_guild_member_query, (user_id, nickname))
                    _log.info(f"用户 {user_id} 已添加到群组，昵称为 {nickname}。")
                else:
                    # 更新用户信息
                    update_user_query = """
                        UPDATE users
                        SET nickname = %s
                        WHERE qq_number = %s
                        RETURNING id
                    """
                    user_id = self.db.execute_query(update_user_query, (nickname, qq_number), fetchone=True)["id"]
                    _log.info(f"用户 {user_id} 信息已更新，QQ号 {qq_number}，新昵称 {nickname}。")

                # 记录绑定关系
                insert_bot_data_query = """
                    INSERT INTO bot_data (member_openid, guild_id, qq_number, user_id)
                    VALUES (%s, 1, %s, %s)
                """
                self.db.execute_query(insert_bot_data_query, (member_openid, qq_number, user_id))
                _log.info(f"用户 {member_openid} 与 QQ号 {qq_number} 的绑定关系已记录。")

                # 删除验证码记录
                delete_query = "DELETE FROM verification_codes WHERE code = %s"
                self.db.execute_query(delete_query, (code,))
                _log.info(f"验证码 {code} 已删除。")

                self.db.commit_transaction()
                _log.info(f"用户 {member_openid} 验证绑定成功。")
                return "绑定成功！"
            except Exception as e:
                self.db.rollback_transaction()
                _log.error(f"验证QQ号时发生错误: {e}")
                raise ValueError("绑定失败，请稍后重试。")

        elif len(args) == 3 and args[0] == "重新绑定" and args[1].isdigit():
            qq_number, nickname = args[1], args[2]
            _log.info(f"用户 {member_openid} 请求重新绑定QQ号 {qq_number}，昵称为 {nickname}。")
            # 检查是否已绑定
            query = """
                SELECT * FROM bot_data WHERE qq_number = %s
            """
            result = self.db.execute_query(query, (qq_number,), fetchone=True)
            if not result:
                _log.warning(f"重新绑定失败：QQ号 {qq_number} 未绑定。")
                raise ValueError("该QQ号未绑定，无法重新绑定。")

            try:
                # 删除所有过期记录
                self.delete_expired_verification_codes()

                # 生成验证码并尝试插入
                code = None
                for _ in range(15):
                    code = self.generate_verification_code()
                    try:
                        expire_time = datetime.now() + timedelta(minutes=10)
                        insert_query = """
                            INSERT INTO verification_codes (qq_number, nickname, code, expire_time, is_rebind)
                            VALUES (%s, %s, %s, %s, TRUE)
                        """
                        self.db.execute_query(insert_query, (qq_number, nickname, code, expire_time))
                        _log.info(f"重新绑定验证码 {code} 为 QQ号 {qq_number} 生成成功。")
                        break
                    except Exception as e:
                        _log.warning(f"验证码插入失败，尝试重新生成: {e}")
                else:
                    _log.error(f"用户 {member_openid} 重新绑定QQ号 {qq_number} 时生成验证码失败。")
                    raise ValueError("生成验证码失败，请稍后重试。")

                # 提交事务
                self.db.commit_transaction()
                _log.info(f"用户 {member_openid} 成功为 QQ号 {qq_number} 生成重新绑定验证码并提交事务。")

                # 发送邮件
                self.send_verification_email(f"{qq_number}@qq.com", code, is_rebind=True)
                _log.info(f"重新绑定验证码邮件已发送至 {qq_number}@qq.com。")
                return "重新绑定验证码已发送，请查收邮件。"
            except Exception as e:
                self.db.rollback_transaction()
                _log.error(f"重新绑定QQ号时发生错误: {e}")
                raise ValueError("重新绑定失败，请稍后重试。")

        else:
            _log.warning(f"用户 {member_openid} 提供的参数格式错误：{args}")
            raise ValueError("参数格式错误。")
