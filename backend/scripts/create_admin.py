"""
创建系统管理员脚本
运行此脚本可以创建初始管理员账号
"""
import asyncio
import sys
import os

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.database import AsyncSessionLocal, engine
from app.models.admin import SystemAdmin
from app.core.security import get_password_hash
from app.core.config import settings


async def test_db_connection():
    """测试数据库连接"""
    try:
        async with engine.connect() as conn:
            await conn.execute(select(1))
        return True
    except Exception as e:
        print(f"❌ 数据库连接失败: {e}")
        print(f"\n当前数据库URL: {settings.DATABASE_URL}")
        print("\n提示：如果在宿主机上运行，请确保 DATABASE_URL 使用 localhost 而不是 shared-postgres")
        return False


async def create_admin(username: str, password: str):
    """
    创建管理员账号

    Args:
        username: 用户名
        password: 密码
    """
    async with AsyncSessionLocal() as session:
        # 检查是否已存在
        result = await session.execute(
            select(SystemAdmin).where(SystemAdmin.username == username)
        )
        existing_admin = result.scalar_one_or_none()

        if existing_admin:
            print(f"❌ 管理员 '{username}' 已存在！")
            return False

        # 创建新管理员
        new_admin = SystemAdmin(
            username=username,
            password_hash=get_password_hash(password)
        )

        session.add(new_admin)
        await session.commit()
        await session.refresh(new_admin)

        print(f"✅ 管理员 '{username}' 创建成功！ID: {new_admin.id}")
        return True


async def create_default_admin():
    """使用配置文件中的默认值创建管理员"""
    print("\n正在创建默认管理员...")
    print(f"用户名: {settings.ADMIN_USERNAME}")

    success = await create_admin(
        settings.ADMIN_USERNAME,
        settings.ADMIN_PASSWORD
    )

    if success:
        print("\n" + "=" * 50)
        print("默认管理员账号信息：")
        print(f"用户名: {settings.ADMIN_USERNAME}")
        print(f"密码: {settings.ADMIN_PASSWORD}")
        print("=" * 50)
        print("\n⚠️  请立即修改默认密码！")


async def create_custom_admin():
    """交互式创建自定义管理员"""
    print("\n创建自定义管理员账号")
    print("-" * 50)
    username = input("请输入用户名: ").strip()

    if not username:
        print("❌ 用户名不能为空！")
        return

    password = input("请输入密码（至少6位）: ").strip()

    if len(password) < 6:
        print("❌ 密码长度至少为6位！")
        return

    password_confirm = input("请再次输入密码: ").strip()

    if password != password_confirm:
        print("❌ 两次密码输入不一致！")
        return

    await create_admin(username, password)


async def main():
    """主函数"""
    print("=" * 50)
    print("系统管理员创建工具")
    print("=" * 50)
    
    # 测试数据库连接
    print("\n正在测试数据库连接...")
    if not await test_db_connection():
        return
    
    print("✅ 数据库连接成功！")
    
    print("\n请选择操作：")
    print("1. 创建默认管理员（使用配置文件中的默认值）")
    print("2. 创建自定义管理员")
    print("0. 退出")

    choice = input("\n请输入选项 (0-2): ").strip()

    if choice == "1":
        await create_default_admin()
    elif choice == "2":
        await create_custom_admin()
    elif choice == "0":
        print("已退出")
    else:
        print("❌ 无效的选项！")


if __name__ == "__main__":
    asyncio.run(main())
