"""
自动初始化管理员账号（幂等操作）
用于容器启动时自动执行
"""
import asyncio
import sys
import os

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.admin import SystemAdmin
from app.core.security import get_password_hash
from app.core.config import settings


async def init_admin():
    """初始化默认管理员（幂等操作）"""
    try:
        async with AsyncSessionLocal() as session:
            # 检查是否已存在
            result = await session.execute(
                select(SystemAdmin).where(SystemAdmin.username == settings.ADMIN_USERNAME)
            )
            existing_admin = result.scalar_one_or_none()

            if existing_admin:
                print(f"ℹ️  管理员 '{settings.ADMIN_USERNAME}' 已存在，跳过创建")
                return

            # 创建新管理员
            new_admin = SystemAdmin(
                username=settings.ADMIN_USERNAME,
                password_hash=get_password_hash(settings.ADMIN_PASSWORD)
            )

            session.add(new_admin)
            await session.commit()
            print(f"✅ 默认管理员 '{settings.ADMIN_USERNAME}' 创建成功")
            print(f"⚠️  请登录后立即修改默认密码！")

    except Exception as e:
        print(f"❌ 初始化管理员失败: {e}")
        # 不退出，让应用继续启动（管理员可能已通过其他方式创建）
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(init_admin())
