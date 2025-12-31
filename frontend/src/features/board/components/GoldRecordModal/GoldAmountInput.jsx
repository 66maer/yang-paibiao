import { useState, useEffect } from "react";
import { Input } from "@heroui/react";

/**
 * 金额数字输入框组件
 * 将数字格式化显示为"X砖Y金"，但保持数字输入行为
 *
 * @param {number} value - 当前金额值
 * @param {function} onChange - 值变化回调
 * @param {string} label - 标签
 * @param {boolean} isRequired - 是否必填
 */
export default function GoldAmountInput({ value, onChange, label = "总金额", isRequired = false }) {
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // 格式化显示函数
  const formatGoldAmount = (val) => {
    if (!val || val === 0) return "";
    const zhuans = Math.floor(val / 10000);
    const golds = val % 10000;

    if (zhuans === 0) return `${golds}金`;
    if (golds === 0) return `${zhuans}砖`;
    return `${zhuans}砖${golds}金`;
  };

  // 解析输入函数
  const parseGoldInput = (str) => {
    const numStr = str.replace(/[^0-9]/g, "");
    return numStr ? parseInt(numStr, 10) : 0;
  };

  // 同步外部value到inputValue
  useEffect(() => {
    // 只在非聚焦状态下格式化显示
    if (!isFocused) {
      setInputValue(formatGoldAmount(value));
    }
  }, [value, isFocused]);

  // 处理输入变化
  const handleInputChange = (val) => {
    // 聚焦时，保持纯数字输入
    if (isFocused) {
      const numStr = val.replace(/[^0-9]/g, "");
      setInputValue(numStr);
      onChange(numStr ? parseInt(numStr, 10) : 0);
    }
  };

  // 处理焦点事件
  const handleFocus = () => {
    setIsFocused(true);
    // 聚焦时显示纯数字
    if (value > 0) {
      setInputValue(value.toString());
    } else {
      setInputValue("");
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // 失焦时格式化显示
    setInputValue(formatGoldAmount(value));
  };

  return (
    <Input
      type="text"
      label={label}
      placeholder="请输入金额"
      value={inputValue}
      onValueChange={handleInputChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      isRequired={isRequired}
    />
  );
}
