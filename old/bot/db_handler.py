import psycopg2
from psycopg2.extras import RealDictCursor
import yaml

class DatabaseHandler:
    def __init__(self):
        with open("config.yaml", "r") as config_file:
            config = yaml.safe_load(config_file)
        db_config = config["postgersql"]
        self.connection = psycopg2.connect(
            dbname=db_config["dbname"],
            user=db_config["user"],
            password=db_config["password"],
            host=db_config["host"],
            port=db_config["port"]
        )
        self.connection.autocommit = False  # 禁用自动提交

    def execute_query(self, query, params=None, fetchone=False, fetchall=False):
        with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, params)
            if fetchone:
                return cursor.fetchone()
            if fetchall:
                return cursor.fetchall()

    def commit_transaction(self):
        # 提交事务
        self.connection.commit()

    def rollback_transaction(self):
        # 回滚事务
        self.connection.rollback()

    def close(self):
        # 关闭数据库连接
        self.connection.close()
