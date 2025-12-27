import { Input } from "@heroui/react";

/**
 * 日期时间输入组件
 * @param {string} value - 日期时间值 (YYYY-MM-DDTHH:mm)
 * @param {function} onChange - 变化回调
 * @param {string} label - 标签
 * @param {boolean} isRequired - 是否必填
 */
export default function DateTimeInput({ value, onChange, label = "日期时间", isRequired = true }) {
  return (
    <Input
      type="datetime-local"
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      isRequired={isRequired}
      classNames={{
        input: "text-sm"
      }}
    />
  );
}
