"""
共享截图服务
使用 Playwright 无头浏览器截取页面图片
可供多个插件共用同一个浏览器实例
"""
import hashlib
from pathlib import Path
from typing import Optional
from playwright.async_api import async_playwright, Browser, BrowserContext, Page
from nonebot import get_driver, logger


class ScreenshotService:
    """截图服务（单例模式）"""

    _instance: Optional["ScreenshotService"] = None
    _browser: Optional[Browser] = None
    _context: Optional[BrowserContext] = None
    _playwright = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        self.cache_dir = Path("cache/screenshots")
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    async def _ensure_browser(self):
        """确保浏览器已启动（延迟初始化）"""
        if self._browser is None:
            logger.info("正在启动 Playwright 浏览器...")
            self._playwright = await async_playwright().start()
            self._browser = await self._playwright.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-dev-shm-usage"]
            )
            self._context = await self._browser.new_context(
                viewport={"width": 1280, "height": 800},
                device_scale_factor=1.5
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
        if self._playwright:
            await self._playwright.stop()
            self._playwright = None
            logger.info("Playwright 浏览器已关闭")

    async def get_page(self) -> Page:
        """获取一个新页面"""
        await self._ensure_browser()
        return await self._context.new_page()

    async def capture_url(
        self,
        url: str,
        wait_for_selector: Optional[str] = None,
        wait_timeout: int = 10000,
        full_page: bool = True,
        cache_key: Optional[str] = None
    ) -> bytes:
        """
        截取指定 URL 的页面图片

        Args:
            url: 要截取的 URL
            wait_for_selector: 等待的 CSS 选择器
            wait_timeout: 等待超时时间（毫秒）
            full_page: 是否截取整个页面
            cache_key: 缓存键（可选）

        Returns:
            PNG 图片的字节数据
        """
        # 检查缓存
        if cache_key:
            cache_path = self.cache_dir / f"{cache_key}.png"
            if cache_path.exists():
                logger.debug(f"使用缓存图片: {cache_path}")
                return cache_path.read_bytes()

        await self._ensure_browser()
        page = await self._context.new_page()

        try:
            logger.debug(f"正在访问页面: {url}")
            await page.goto(url, wait_until="networkidle", timeout=15000)

            if wait_for_selector:
                try:
                    await page.wait_for_selector(wait_for_selector, timeout=wait_timeout)
                except Exception as e:
                    logger.warning(f"等待选择器超时: {e}")

            screenshot = await page.screenshot(type="png", full_page=full_page)
            logger.debug(f"截图成功，大小: {len(screenshot)} bytes")

            # 保存缓存
            if cache_key:
                cache_path = self.cache_dir / f"{cache_key}.png"
                cache_path.write_bytes(screenshot)

            return screenshot

        finally:
            await page.close()

    async def capture_html(
        self,
        html_content: str,
        width: int = 800,
        wait_for_selector: Optional[str] = None,
        wait_timeout: int = 5000,
        cache_key: Optional[str] = None
    ) -> bytes:
        """
        截取 HTML 内容的图片

        Args:
            html_content: HTML 内容
            width: 视口宽度
            wait_for_selector: 等待的 CSS 选择器
            wait_timeout: 等待超时时间（毫秒）
            cache_key: 缓存键（可选）

        Returns:
            PNG 图片的字节数据
        """
        # 检查缓存
        if cache_key:
            cache_path = self.cache_dir / f"{cache_key}.png"
            if cache_path.exists():
                logger.debug(f"使用缓存图片: {cache_path}")
                return cache_path.read_bytes()

        await self._ensure_browser()
        page = await self._context.new_page()

        try:
            await page.set_viewport_size({"width": width, "height": 800})
            await page.set_content(html_content, wait_until="networkidle")

            if wait_for_selector:
                try:
                    await page.wait_for_selector(wait_for_selector, timeout=wait_timeout)
                except Exception as e:
                    logger.warning(f"等待选择器超时: {e}")

            # 获取内容实际高度
            body_height = await page.evaluate("document.body.scrollHeight")
            await page.set_viewport_size({"width": width, "height": body_height or 800})

            screenshot = await page.screenshot(type="png", full_page=True)
            logger.debug(f"HTML 截图成功，大小: {len(screenshot)} bytes")

            # 保存缓存
            if cache_key:
                cache_path = self.cache_dir / f"{cache_key}.png"
                cache_path.write_bytes(screenshot)

            return screenshot

        finally:
            await page.close()

    def generate_cache_key(self, *args) -> str:
        """生成缓存键"""
        key_str = "_".join(str(arg) for arg in args)
        return hashlib.md5(key_str.encode()).hexdigest()

    async def cleanup_cache(self, pattern: str = "*.png", keep: int = 100):
        """清理缓存文件"""
        try:
            cache_files = sorted(
                self.cache_dir.glob(pattern),
                key=lambda p: p.stat().st_mtime,
                reverse=True,
            )
            for old_file in cache_files[keep:]:
                old_file.unlink()
                logger.debug(f"已删除旧缓存: {old_file}")
        except Exception as e:
            logger.warning(f"清理缓存失败: {e}")


# 全局单例实例
screenshot_service = ScreenshotService()

# 在 NoneBot 关闭时清理浏览器资源
driver = get_driver()


@driver.on_shutdown
async def cleanup_browser():
    """NoneBot 关闭时清理浏览器"""
    await screenshot_service.close()
