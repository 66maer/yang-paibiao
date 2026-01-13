"""
渲染模块
提供 Jinja2 模板渲染和 Playwright 截图服务
"""

from .service import render_service, RenderService

__all__ = ["render_service", "RenderService"]
