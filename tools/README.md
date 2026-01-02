# SVG 转 React 组件工具

## 功能说明

这个 Python 脚本可以将标准的 SVG 格式转换为 React 组件格式。

## 主要功能

1. **属性名驼峰化**：将 `stroke-width` 转换为 `strokeWidth`，`xml:space` 转换为 `xmlSpace` 等
2. **样式对象化**：将字符串样式 `style="fill:#FFB969"` 转换为对象格式 `style={{ fill: "#FFB969" }}`
3. **移除冗余属性**：自动移除 `class`、`data-*` 等非标准属性
4. **属性透传**：自动在 `<svg>` 标签中注入 `{...props}`
5. **单行输出**：生成的代码为单行格式，方便复制使用

## 使用方法

### 运行脚本

```bash
cd tools
python3 svg_to_react.py
```

### 使用流程

1. 运行脚本后，会提示输入 SVG 内容
2. 粘贴完整的 SVG 代码（可以多行）
3. 当检测到 SVG 标签闭合时，自动进行转换
4. 输出转换后的单行 React 组件代码
5. 双击复制结果即可
6. 脚本会继续循环等待下一个输入（按 Ctrl+C 退出）

## 示例

### 输入（标准 SVG）

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="100" height="100" style="fill:#FFB969" />
</svg>
```

### 输出（React 组件）

```javascript
export const Icon = ({ size = 24, width, height, ...props }) => (<svg xmlns="http://www.w3.org/2000/svg" width={size || width} height={size || height} viewBox="0 0 512 512" {...props}><rect width="100" height="100" style={{ fill: "#FFB969" }} /></svg>);
```

### 组件参数说明

- `size`: 统一的尺寸大小，默认值为 24
- `width`: 自定义宽度（优先级低于 size）
- `height`: 自定义高度（优先级低于 size）
- `...props`: 其他透传属性

使用示例：
```jsx
<Icon />                        // 使用默认 size=24
<Icon size={32} />              // 统一设置为 32x32
<Icon width={100} height={50} />  // 自定义尺寸 100x50
```

## 注意事项

- 输出为单行代码，使用 Prettier 等格式化工具可以自动格式化
- 脚本会自动移除 SVG 中的注释
- 空的 `style` 属性会被自动移除
- `data-*` 属性会被移除（通常用于编辑器，React 中不需要）

## 转换规则

### 属性转换

- `stroke-width` → `strokeWidth`
- `stroke-linecap` → `strokeLinecap`
- `fill-opacity` → `fillOpacity`
- `xml:space` → `xmlSpace`
- 等等...

### 样式转换

- `style="opacity:0.1"` → `style={{ opacity: 0.1 }}`
- `style="fill:#FFB969"` → `style={{ fill: "#FFB969" }}`
- `style="enable-background:new"` → `style={{ enableBackground: "new" }}`

### 属性移除

- `class="..."`
- `data-original="..."`
- 其他 `data-*` 属性
