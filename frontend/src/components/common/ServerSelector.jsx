import { Select, SelectSection, SelectItem } from '@heroui/react'
import { SERVERS } from '@/config/servers'

/**
 * 服务器选择器组件 - 支持清除和搜索
 * @param {string} label - 标签文字
 * @param {string} placeholder - 占位符
 * @param {string} value - 当前选中的服务器
 * @param {function} onChange - 值改变时的回调函数
 * @param {boolean} isRequired - 是否必填
 * @param {string} className - 自定义样式类
 * @param {string} variant - 选择器变体
 */
export default function ServerSelector({
  label = '服务器',
  placeholder = '选择服务器',
  value,
  onChange,
  isRequired = false,
  className = '',
  variant = 'flat',
  ...props
}) {
  const handleSelectionChange = (keys) => {
    const selectedValue = Array.from(keys)[0] || ''
    onChange(selectedValue)
  }

  // 添加清除功能的自定义渲染
  const handleClear = () => {
    onChange('')
  }

  return (
    <div className="relative">
      <Select
        label={label}
        placeholder={placeholder}
        selectedKeys={value ? [value] : []}
        onSelectionChange={handleSelectionChange}
        isRequired={isRequired}
        className={className}
        variant={variant}
        disallowEmptySelection={false}
        {...props}
      >
        {Object.entries(SERVERS).map(([region, servers]) => (
          <SelectSection key={region} title={region}>
            {servers.map((server) => (
              <SelectItem key={server} value={server}>
                {server}
              </SelectItem>
            ))}
          </SelectSection>
        ))}
      </Select>
      {value && !isRequired && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
          aria-label="清除选择"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}
