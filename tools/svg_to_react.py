#!/usr/bin/env python3
import re

def camel_case(name):
    """将属性名转换为驼峰式"""
    conversions = {
        'xml:space': 'xmlSpace',
        'xmlns:xlink': 'xmlns:xlink',
        'stroke-width': 'strokeWidth',
        'stroke-linecap': 'strokeLinecap',
        'stroke-linejoin': 'strokeLinejoin',
        'fill-opacity': 'fillOpacity',
        'stroke-opacity': 'strokeOpacity',
        'fill-rule': 'fillRule',
        'clip-rule': 'clipRule',
        'stroke-dasharray': 'strokeDasharray',
        'stroke-dashoffset': 'strokeDashoffset',
        'stroke-miterlimit': 'strokeMiterlimit',
        'enable-background': 'enableBackground',
    }
    if name in conversions:
        return conversions[name]
    if ':' in name and name.startswith('xmlns'):
        return name
    parts = name.split('-')
    if len(parts) == 1:
        return name
    return parts[0] + ''.join(word.capitalize() for word in parts[1:])

def parse_style(style_str):
    """将CSS样式字符串转换为React对象格式"""
    if not style_str or not style_str.strip():
        return None
    styles = {}
    for item in style_str.split(';'):
        item = item.strip()
        if ':' in item and item:
            key, value = item.split(':', 1)
            key = key.strip()
            value = value.strip()
            if not key or not value:
                continue
            camel_key = camel_case(key)
            # 判断是否为数字（包括小数和负数）
            try:
                float(value)
                styles[camel_key] = value
            except ValueError:
                styles[camel_key] = f'"{value}"'

    if not styles:
        return None

    style_obj = ', '.join(f'{k}: {v}' for k, v in styles.items())
    return f'{{{ style_obj }}}'

def convert_attributes(svg_content):
    """转换SVG属性"""
    # 移除注释
    svg_content = re.sub(r'<!--.*?-->', '', svg_content, flags=re.DOTALL)

    # 移除 class 属性和非标准的冗余属性
    svg_content = re.sub(r'\s+class="[^"]*"', '', svg_content)
    # 移除 data-original 等非必要属性
    svg_content = re.sub(r'\s+data-[a-z-]+="[^"]*"', '', svg_content)

    # 转换 style 属性
    def replace_style(match):
        style_value = match.group(1)
        react_style = parse_style(style_value)
        if react_style is None or react_style == '{}':
            return ''
        return f' style={{{react_style}}}'

    svg_content = re.sub(r'\s*style="([^"]*)"', replace_style, svg_content)

    # 转换 xml:space 为 xmlSpace
    svg_content = re.sub(r'xml:space=', 'xmlSpace=', svg_content)

    # 转换其他属性为驼峰式
    def replace_attr(match):
        attr_name = match.group(1)
        attr_value = match.group(2)
        camel_name = camel_case(attr_name)
        return f'{camel_name}="{attr_value}"'

    # 匹配属性（排除已经处理的style和已经是驼峰的）
    svg_content = re.sub(
        r'([a-z]+(?:-[a-z]+)+)="([^"]*)"',
        replace_attr,
        svg_content
    )

    # 在svg标签后添加 {...props}
    svg_content = re.sub(
        r'(<svg[^>]*)(>)',
        r'\1 {...props}\2',
        svg_content,
        count=1
    )

    return svg_content

def read_svg_input():
    """循环读取输入直到SVG标签闭合"""
    print("请输入SVG内容（完整的SVG标签闭合后自动处理）：")
    lines = []
    svg_count = 0

    while True:
        try:
            line = input()
            lines.append(line)

            # 统计 <svg 和 </svg> 标签
            svg_count += line.count('<svg')
            svg_count -= line.count('</svg>')

            # 如果SVG标签已闭合，处理内容
            if svg_count == 0 and any('<svg' in l for l in lines):
                break
        except EOFError:
            break

    return '\n'.join(lines)

def process_size_attributes(svg_content):
    """处理 width 和 height 属性，替换为动态表达式"""
    # 替换 width 属性
    svg_content = re.sub(
        r'width="[^"]*"',
        'width={size || width}',
        svg_content,
        count=1
    )
    # 替换 height 属性
    svg_content = re.sub(
        r'height="[^"]*"',
        'height={size || height}',
        svg_content,
        count=1
    )
    return svg_content

def main():
    while True:
        svg_content = read_svg_input()

        if not svg_content.strip():
            print("未输入内容，退出。")
            break

        # 转换SVG
        react_svg = convert_attributes(svg_content)

        # 处理 size 属性
        react_svg = process_size_attributes(react_svg)

        # 生成单行React组件代码
        react_svg_oneline = ' '.join(react_svg.split())
        output = f'export const Icon = ({{ size = 24, width, height, ...props }}) => ({react_svg_oneline});'

        print("\n转换结果：")
        print(output)
        print("\n" + "="*80 + "\n")

if __name__ == '__main__':
    main()
