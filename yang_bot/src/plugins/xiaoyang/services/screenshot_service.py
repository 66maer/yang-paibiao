"""
团队图片截图服务
使用 Playwright 无头浏览器截取团队看板图片
"""
import os
import hashlib
from pathlib import Path
from typing import Optional
from playwright.async_api import async_playwright, Browser, BrowserContext
from nonebot import get_driver, logger

from ..config import Config

# 获取配置
config = Config()


class ScreenshotService:
    """截图服务（单例模式）"""

    _instance: Optional["ScreenshotService"] = None
    _browser: Optional[Browser] = None
    _context: Optional[BrowserContext] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        self.cache_dir = Path("cache/screenshots")
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.frontend_url = config.frontend_url
        self.api_key = config.backend_api_key

    async def _ensure_browser(self):
        """确保浏览器已启动（延迟初始化）"""
        if self._browser is None:
            logger.info("正在启动 Playwright 浏览器...")
            playwright = await async_playwright().start()
            self._browser = await playwright.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-dev-shm-usage"]
            )
            self._context = await self._browser.new_context(
                viewport={"width": 1280, "height": 0},
                device_scale_factor=1
            )
            logger.info("Playwright 浏览器启动成功")

    async def close(self):
        """关闭浏览器"""
        if self._context:
            await self._context.close()
            self._context = None
        if self._browser:
            await self._browser.close()
            self._browser = None
            logger.info("Playwright 浏览器已关闭")

    def _get_cache_key(
        self,
        guild_id: str,
        team_id: int,
        cache_timestamp: str,
        signup_count: Optional[int] = None,
        total_signup_count: Optional[int] = None
    ) -> str:
        """
        生成缓存键

        Args:
            guild_id: QQ群号
            team_id: 团队ID
            cache_timestamp: 缓存时间戳（ISO格式字符串）
            signup_count: 有效报名人数（可选，用于增强缓存key）
            total_signup_count: 总报名人数（可选，用于增强缓存key）

        Returns:
            缓存键（文件名）
        """
        # 构建缓存key字符串，包含报名统计数据以提高缓存准确性
        key_str = f"{guild_id}_{team_id}_{cache_timestamp}"
        if signup_count is not None:
            key_str += f"_s{signup_count}"
        if total_signup_count is not None:
            key_str += f"_t{total_signup_count}"
        hash_value = hashlib.md5(key_str.encode()).hexdigest()
        return f"team_{team_id}_{hash_value}.png"

    def _get_cache_path(self, cache_key: str) -> Path:
        """获取缓存文件路径"""
        return self.cache_dir / cache_key

    async def capture_team_image(
        self,
        guild_id: str,
        team_id: int,
        cache_timestamp: Optional[str] = None,
        signup_count: Optional[int] = None,
        total_signup_count: Optional[int] = None
    ) -> bytes:
        """
        截取团队图片

        Args:
            guild_id: QQ群号
            team_id: 团队ID
            cache_timestamp: 缓存时间戳（可选，用于缓存）
            signup_count: 有效报名人数（可选，用于增强缓存key）
            total_signup_count: 总报名人数（可选，用于增强缓存key）

        Returns:
            PNG图片的字节数据

        Raises:
            Exception: 截图失败时抛出异常
        """
        # 检查缓存
        if cache_timestamp:
            cache_key = self._get_cache_key(
                guild_id, team_id, cache_timestamp, signup_count, total_signup_count
            )
            cache_path = self._get_cache_path(cache_key)

            if cache_path.exists():
                logger.info(f"使用缓存图片: {cache_path}")
                return cache_path.read_bytes()

        # 确保浏览器已启动
        await self._ensure_browser()

        try:
            # 创建新页面
            page = await self._context.new_page()

            # 构建URL（guild_id 这里是 QQ 群号）
            url = f"{self.frontend_url}/bot/guilds/{guild_id}/teams/{team_id}?apiKey={self.api_key}"
            logger.info(f"正在访问页面: {url}")

            # 访问页面
            await page.goto(url, wait_until="networkidle", timeout=15000)

            # 等待数据加载完成（等待特定元素出现）
            try:
                await page.wait_for_selector(
                    "[data-screenshot-ready='true']", timeout=10000
                )
            except Exception as e:
                logger.warning(f"等待截图就绪标记超时: {e}")

            # 截图
            screenshot = await page.screenshot(type="png", full_page=True)
            await page.close()

            logger.info(f"截图成功，大小: {len(screenshot)} bytes")

            # 保存缓存
            if cache_timestamp:
                # 重新生成缓存key和路径（确保与检查缓存时使用相同的参数）
                cache_key = self._get_cache_key(
                    guild_id, team_id, cache_timestamp, signup_count, total_signup_count
                )
                cache_path = self._get_cache_path(cache_key)
                cache_path.write_bytes(screenshot)
                logger.info(f"已保存缓存: {cache_path}")

                # 清理旧缓存（保留最近的10个）
                self._cleanup_old_cache(team_id, keep=10)

            return screenshot

        except Exception as e:
            logger.error(f"截图失败: {e}")
            raise

    async def capture_url(self, url: str, selector: str = "[data-screenshot-ready='true']") -> bytes:
        """
        通用 URL 截图，复用现有 Playwright 浏览器实例。
        不使用缓存（每次内容可能不同）。

        Args:
            url: 要截图的完整 URL
            selector: 等待的 CSS 选择器

        Returns:
            PNG 图片的字节数据
        """
        await self._ensure_browser()

        try:
            page = await self._context.new_page()
            logger.info(f"通用截图 - 访问页面: {url}")

            await page.goto(url, wait_until="networkidle", timeout=15000)

            try:
                await page.wait_for_selector(selector, timeout=10000)
            except Exception as e:
                logger.warning(f"通用截图 - 等待选择器超时: {e}")

            screenshot = await page.screenshot(type="png", full_page=True)
            await page.close()

            logger.info(f"通用截图成功，大小: {len(screenshot)} bytes")
            return screenshot

        except Exception as e:
            logger.error(f"通用截图失败: {e}")
            raise

    def _cleanup_old_cache(self, team_id: int, keep: int = 10):
        """
        清理旧缓存文件

        Args:
            team_id: 团队ID
            keep: 保留最近的文件数量
        """
        try:
            # 查找该团队的所有缓存文件
            pattern = f"team_{team_id}_*.png"
            cache_files = sorted(
                self.cache_dir.glob(pattern),
                key=lambda p: p.stat().st_mtime,
                reverse=True,
            )

            # 删除多余的缓存文件
            for old_file in cache_files[keep:]:
                old_file.unlink()
                logger.debug(f"已删除旧缓存: {old_file}")

        except Exception as e:
            logger.warning(f"清理缓存失败: {e}")

    async def cleanup_all_cache(self):
        """清理所有缓存文件"""
        try:
            for cache_file in self.cache_dir.glob("*.png"):
                cache_file.unlink()
            logger.info("已清理所有缓存文件")
        except Exception as e:
            logger.warning(f"清理所有缓存失败: {e}")


# 全局单例实例
screenshot_service = ScreenshotService()


# 在NoneBot关闭时清理浏览器资源
driver = get_driver()


@driver.on_shutdown
async def cleanup_browser():
    """NoneBot关闭时清理浏览器"""
    await screenshot_service.close()
