"""
渲染服务
使用 Jinja2 模板引擎 + Playwright 截图生成图片
"""
import json
import hashlib
from datetime import datetime
from pathlib import Path
from typing import Any, Optional
import asyncio

from jinja2 import Environment, FileSystemLoader, select_autoescape
from nonebot import get_driver, logger

# 模板和静态资源目录
TEMPLATE_DIR = Path(__file__).parent / "templates"
STATIC_DIR = Path(__file__).parent / "static"
CACHE_DIR = Path(__file__).parent.parent.parent.parent.parent.parent / "data" / "jx3bot" / "cache"


def format_time(value: Any, fmt: str = "%Y-%m-%d %H:%M") -> str:
    """格式化时间戳"""
    if not value:
        return ""
    try:
        if isinstance(value, (int, float)):
            return datetime.fromtimestamp(value).strftime(fmt)
        elif isinstance(value, str):
            if value.isdigit():
                return datetime.fromtimestamp(int(value)).strftime(fmt)
            return value
        return str(value)
    except Exception:
        return str(value)


def format_interval(value: Any) -> str:
    """格式化时间间隔为相对时间"""
    if not value:
        return ""
    try:
        if isinstance(value, (int, float)):
            ts = value
        elif isinstance(value, str) and value.isdigit():
            ts = int(value)
        else:
            return str(value)
        
        now = datetime.now()
        dt = datetime.fromtimestamp(ts)
        diff = now - dt
        
        seconds = int(diff.total_seconds())
        if seconds < 60:
            return f"{seconds}秒前"
        elif seconds < 3600:
            return f"{seconds // 60}分钟前"
        elif seconds < 86400:
            return f"{seconds // 3600}小时前"
        elif seconds < 2592000:  # 30天
            return f"{seconds // 86400}天前"
        elif seconds < 31536000:  # 365天
            return f"{seconds // 2592000}个月前"
        else:
            return f"{seconds // 31536000}年前"
    except Exception:
        return str(value)


def format_duration(start: Any, end: Any) -> str:
    """计算两个时间戳之间的时长"""
    if not start or not end:
        return ""
    try:
        start_ts = int(start) if isinstance(start, (int, float, str)) else 0
        end_ts = int(end) if isinstance(end, (int, float, str)) else 0
        total_seconds = end_ts - start_ts
        
        if total_seconds >= 60:
            minutes = total_seconds // 60
            seconds = total_seconds % 60
            return f"{minutes}分{seconds}秒"
        return f"{total_seconds}秒"
    except Exception:
        return ""


def trade_type(value: Any) -> str:
    """交易类型转换"""
    type_map = {
        1: "出售",
        2: "收购",
        3: "想出",
        4: "想收",
        5: "成交",
        6: "在售",
        7: "公示",
    }
    try:
        return type_map.get(int(value), str(value))
    except (ValueError, TypeError):
        return str(value)


def limit_list(arr: list, limit: int) -> list:
    """限制列表长度"""
    if not isinstance(arr, list):
        return []
    return arr[:limit]


def default_value(value: Any, default: Any) -> Any:
    """默认值"""
    return value if value else default


def to_json(value: Any) -> str:
    """转换为 JSON 字符串"""
    return json.dumps(value, ensure_ascii=False)


class RenderService:
    """渲染服务类"""
    
    _instance: Optional["RenderService"] = None
    _playwright = None
    _browser = None
    _lock = asyncio.Lock()
    
    def __init__(self):
        # 确保目录存在
        TEMPLATE_DIR.mkdir(parents=True, exist_ok=True)
        STATIC_DIR.mkdir(parents=True, exist_ok=True)
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        
        # 初始化 Jinja2 环境
        self.env = Environment(
            loader=FileSystemLoader(str(TEMPLATE_DIR)),
            autoescape=select_autoescape(['html', 'xml']),
            enable_async=True
        )
        
        # 注册自定义过滤器
        self.env.filters['format_time'] = format_time
        self.env.filters['format_interval'] = format_interval
        self.env.filters['duration'] = format_duration
        self.env.filters['trade_type'] = trade_type
        self.env.filters['limit'] = limit_list
        self.env.filters['default_value'] = default_value
        self.env.filters['tojson'] = to_json
        
        # 注册全局函数
        self.env.globals['now'] = datetime.now
        
        # 静态资源基础 URL（本地文件路径）
        self.static_base = STATIC_DIR.as_uri()
    
    @classmethod
    def get_instance(cls) -> "RenderService":
        """获取单例实例"""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
    
    async def _ensure_browser(self):
        """确保浏览器实例存在"""
        async with self._lock:
            if self._browser is None:
                try:
                    from playwright.async_api import async_playwright
                    self._playwright = await async_playwright().start()
                    self._browser = await self._playwright.chromium.launch(
                        headless=True,
                        args=['--no-sandbox', '--disable-dev-shm-usage']
                    )
                    logger.info("Playwright 浏览器已启动")
                except Exception as e:
                    logger.error(f"启动浏览器失败: {e}")
                    raise
    
    async def close(self):
        """关闭浏览器"""
        async with self._lock:
            if self._browser:
                await self._browser.close()
                self._browser = None
            if self._playwright:
                await self._playwright.stop()
                self._playwright = None
            logger.info("Playwright 浏览器已关闭")
    
    def _get_cache_path(self, template_name: str, cache_key: str) -> Path:
        """获取缓存文件路径"""
        key_hash = hashlib.md5(cache_key.encode()).hexdigest()[:12]
        return CACHE_DIR / f"{template_name}_{key_hash}.png"
    
    async def render(
        self,
        template_name: str,
        data: dict[str, Any],
        cache_key: Optional[str] = None,
        use_cache: bool = False
    ) -> bytes:
        """
        渲染模板并生成图片
        
        Args:
            template_name: 模板名称（不含扩展名）
            data: 模板数据
            cache_key: 缓存键（用于缓存图片）
            use_cache: 是否使用缓存
        
        Returns:
            PNG 图片的 bytes 数据
        """
        # 检查缓存
        if use_cache and cache_key:
            cache_path = self._get_cache_path(template_name, cache_key)
            if cache_path.exists():
                logger.debug(f"使用缓存图片: {cache_path}")
                return cache_path.read_bytes()
        
        # 添加静态资源路径到数据
        data["static_base"] = self.static_base
        
        # 渲染 HTML
        try:
            template = self.env.get_template(f"{template_name}.html")
            html = await template.render_async(**data)
        except Exception as e:
            logger.error(f"模板渲染失败: {e}")
            raise
        
        # 保存临时 HTML 文件
        temp_html = CACHE_DIR / f"temp_{template_name}_{id(data)}.html"
        temp_html.write_text(html, encoding='utf-8')
        
        try:
            # 确保浏览器可用
            await self._ensure_browser()
            
            # 创建页面并截图
            page = await self._browser.new_page()
            try:
                await page.goto(temp_html.as_uri(), wait_until='networkidle')
                screenshot = await page.screenshot(full_page=True)
                
                # 保存到缓存
                if cache_key:
                    cache_path = self._get_cache_path(template_name, cache_key)
                    cache_path.write_bytes(screenshot)
                
                return screenshot
            finally:
                await page.close()
        finally:
            # 清理临时文件
            temp_html.unlink(missing_ok=True)
    
    async def render_html(
        self,
        html: str,
        width: int = 1400
    ) -> bytes:
        """
        渲染 HTML 字符串并生成图片
        
        Args:
            html: HTML 字符串
            width: 视口宽度
        
        Returns:
            PNG 图片的 bytes 数据
        """
        # 保存临时 HTML 文件
        temp_html = CACHE_DIR / f"temp_{id(html)}.html"
        temp_html.write_text(html, encoding='utf-8')
        
        try:
            await self._ensure_browser()
            
            page = await self._browser.new_page(viewport={'width': width, 'height': 800})
            try:
                await page.goto(temp_html.as_uri(), wait_until='networkidle')
                screenshot = await page.screenshot(full_page=True)
                return screenshot
            finally:
                await page.close()
        finally:
            temp_html.unlink(missing_ok=True)


# 单例实例
render_service = RenderService.get_instance()

# NoneBot 关闭时清理资源
driver = get_driver()


@driver.on_shutdown
async def cleanup():
    await render_service.close()
