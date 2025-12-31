import { useState, useMemo, useEffect } from "react";
import { Autocomplete, AutocompleteItem } from "@heroui/react";
import { pinyin } from "pinyin-pro";
import { xinfaInfoTable, allXinfaList } from "@/config/xinfa";

/**
 * 心法选择器组件 - 支持名称、昵称、拼音搜索
 * @param {string} label - 标签文字
 * @param {string} placeholder - 占位符
 * @param {string} value - 当前选中的心法名称
 * @param {function} onChange - 值改变时的回调函数
 * @param {boolean} isRequired - 是否必填
 * @param {string} className - 自定义样式类
 * @param {string} variant - 选择器变体
 */
export default function XinfaSelector({
  label,
  placeholder = "请选择心法",
  value,
  onChange,
  isRequired = false,
  className = "",
  variant = "flat",
  ...props
}) {
  const [searchText, setSearchText] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 预处理心法数据，添加拼音信息
  const xinfaData = useMemo(() => {
    return allXinfaList.map((xinfaKey) => {
      const xinfa = xinfaInfoTable[xinfaKey];
      // 生成拼音（全拼和首字母）
      const namePinyin = pinyin(xinfa.name, { toneType: "none", type: "array" }).join("");
      const nameInitials = pinyin(xinfa.name, { pattern: "first", toneType: "none", type: "array" }).join("");

      // 为所有昵称生成拼音
      const nicknamePinyin = xinfa.nickname.map((nick) => ({
        text: nick,
        pinyin: pinyin(nick, { toneType: "none", type: "array" }).join(""),
        initials: pinyin(nick, { pattern: "first", toneType: "none", type: "array" }).join(""),
      }));

      return {
        key: xinfaKey,
        name: xinfa.name,
        nickname: xinfa.nickname,
        icon: xinfa.icon,
        menpai: xinfa.menpai,
        namePinyin,
        nameInitials,
        nicknamePinyin,
        // 搜索用的组合字符串
        searchText: [
          xinfa.name,
          namePinyin,
          nameInitials,
          ...xinfa.nickname,
          ...nicknamePinyin.map((n) => n.pinyin),
          ...nicknamePinyin.map((n) => n.initials),
        ]
          .join("|")
          .toLowerCase(),
      };
    });
  }, []);

  // 获取选中心法的数据
  const selectedXinfa = useMemo(() => {
    return xinfaData.find((x) => x.key === value);
  }, [value, xinfaData]);

  // 根据搜索文本过滤心法
  const filteredXinfa = useMemo(() => {
    // 如果没有搜索文本，显示所有心法
    if (!searchText.trim()) {
      return xinfaData;
    }

    const searchKey = searchText.toLowerCase().trim();
    return xinfaData.filter((xinfa) => xinfa.searchText.includes(searchKey));
  }, [searchText, xinfaData]);

  // 当菜单打开时，如果当前有选中值，将其滚动到视图中
  const handleOpenChange = (open) => {
    setIsMenuOpen(open);
    if (open) {
      // 菜单打开时，清空搜索文本，让用户可以重新输入
      setSearchText("");
    } else {
      // 菜单关闭时，也清空搜索文本
      setSearchText("");
    }
  };

  const handleSelectionChange = (key) => {
    if (key) {
      onChange(key);
      // 选中后清空搜索文本
      setSearchText("");
    } else {
      onChange("");
      setSearchText("");
    }
  };

  const handleInputChange = (inputValue) => {
    // 如果有选中值，且输入值以选中值开头，说明是在选中值后面追加输入
    // 这种情况下，我们只保留新输入的部分
    if (selectedXinfa && inputValue.startsWith(selectedXinfa.name)) {
      const newInput = inputValue.slice(selectedXinfa.name.length);
      setSearchText(newInput);
    } else {
      // 否则直接更新搜索文本
      setSearchText(inputValue);
    }
  };

  // 计算输入框应该显示的值
  const displayValue = useMemo(() => {
    // 如果有搜索文本（用户正在输入），显示搜索文本
    if (searchText) {
      return searchText;
    }
    // 如果有选中的值，显示选中的心法名称
    if (selectedXinfa) {
      return selectedXinfa.name;
    }
    // 否则显示空
    return "";
  }, [searchText, selectedXinfa]);

  return (
    <Autocomplete
      label={label}
      placeholder={placeholder}
      selectedKey={value || null}
      onSelectionChange={handleSelectionChange}
      inputValue={displayValue}
      onInputChange={handleInputChange}
      onOpenChange={handleOpenChange}
      isRequired={isRequired}
      className={className}
      variant={variant}
      allowsCustomValue={false}
      defaultItems={filteredXinfa}
      items={filteredXinfa}
      startContent={
        selectedXinfa && !searchText ? (
          <img src={`/xinfa/${selectedXinfa.icon}`} alt={selectedXinfa.name} className="w-5 h-5 rounded" />
        ) : null
      }
      {...props}
    >
      {(xinfa) => (
        <AutocompleteItem
          key={xinfa.key}
          value={xinfa.key}
          textValue={xinfa.name}
          startContent={<img src={`/xinfa/${xinfa.icon}`} alt={xinfa.name} className="w-5 h-5 rounded" />}
        >
          {xinfa.name}
        </AutocompleteItem>
      )}
    </Autocomplete>
  );
}
