"""
共享模块
提供跨插件共用的服务和工具
"""

from .screenshot_service import ScreenshotService, screenshot_service

__all__ = ["ScreenshotService", "screenshot_service"]
