import { useState, useMemo } from "react";
import { Chip, Button, Popover, PopoverTrigger, PopoverContent, Input, ScrollShadow } from "@heroui/react";
import { pinyin } from "pinyin-pro";
import { xinfaInfoTable, allXinfaList } from "@/config/xinfa";

/**
 * 多修心法选择器组件 - 用于选择多个心法
 * @param {string} label - 标签文字
 * @param {string[]} value - 当前选中的心法key数组
 * @param {function} onChange - 值改变时的回调函数
 * @param {string} excludeXinfa - 需要排除的心法（通常是主心法）
 * @param {number} maxCount - 最大选择数量
 * @param {string} className - 自定义样式类
 */
export default function SecondaryXinfaSelector({
  label = "多修心法",
  value = [],
  onChange,
  excludeXinfa = null,
  maxCount = 5,
  className = "",
}) {
  const [searchText, setSearchText] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // 预处理心法数据，添加拼音信息
  const xinfaData = useMemo(() => {
    return allXinfaList
      .filter((key) => key !== excludeXinfa) // 排除主心法
      .map((xinfaKey) => {
        const xinfa = xinfaInfoTable[xinfaKey];
        const namePinyin = pinyin(xinfa.name, { toneType: "none", type: "array" }).join("");
        const nameInitials = pinyin(xinfa.name, { pattern: "first", toneType: "none", type: "array" }).join("");

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
          color: xinfa.color,
          namePinyin,
          nameInitials,
          nicknamePinyin,
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
  }, [excludeXinfa]);

  // 根据搜索文本过滤心法
  const filteredXinfa = useMemo(() => {
    if (!searchText.trim()) {
      return xinfaData;
    }
    const searchKey = searchText.toLowerCase().trim();
    return xinfaData.filter((xinfa) => xinfa.searchText.includes(searchKey));
  }, [searchText, xinfaData]);

  // 切换心法选择
  const handleToggle = (xinfaKey) => {
    if (value.includes(xinfaKey)) {
      // 取消选择
      onChange(value.filter((k) => k !== xinfaKey));
    } else if (value.length < maxCount) {
      // 添加选择
      onChange([...value, xinfaKey]);
    }
  };

  // 移除已选心法
  const handleRemove = (xinfaKey) => {
    onChange(value.filter((k) => k !== xinfaKey));
  };

  // 获取选中的心法信息
  const selectedXinfas = useMemo(() => {
    return value.map((key) => ({
      key,
      ...xinfaInfoTable[key],
    }));
  }, [value]);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-default-600">{label}</span>
        <span className="text-xs text-default-400">
          {value.length}/{maxCount}
        </span>
      </div>

      {/* 已选心法展示 */}
      <div className="flex flex-wrap gap-2 min-h-[32px]">
        {selectedXinfas.map((xinfa) => (
          <Chip
            key={xinfa.key}
            variant="flat"
            onClose={() => handleRemove(xinfa.key)}
            avatar={<img src={`/xinfa/${xinfa.icon}`} alt={xinfa.name} className="w-5 h-5" />}
            style={{ backgroundColor: `${xinfa.color}30`, borderColor: xinfa.color }}
            classNames={{
              base: "border",
              content: "text-sm font-medium",
            }}
          >
            {xinfa.name}
          </Chip>
        ))}

        {/* 添加按钮 */}
        <Popover isOpen={isOpen} onOpenChange={setIsOpen} placement="bottom-start">
          <PopoverTrigger>
            <Button size="sm" variant="flat" color="default" isDisabled={value.length >= maxCount} className="h-8">
              + 添加多修
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-2 w-80">
            <div className="space-y-2">
              <Input
                placeholder="搜索心法..."
                value={searchText}
                onValueChange={setSearchText}
                size="sm"
                variant="bordered"
                classNames={{ input: "text-sm" }}
              />
              <ScrollShadow className="max-h-64">
                <div className="grid grid-cols-4 gap-1">
                  {filteredXinfa.map((xinfa) => {
                    const isSelected = value.includes(xinfa.key);
                    return (
                      <button
                        key={xinfa.key}
                        onClick={() => handleToggle(xinfa.key)}
                        className={`
                          flex flex-col items-center p-2 rounded-lg transition-all
                          ${isSelected ? "bg-primary/20 ring-2 ring-primary" : "hover:bg-default-100"}
                        `}
                        title={xinfa.name}
                      >
                        <img src={`/xinfa/${xinfa.icon}`} alt={xinfa.name} className="w-8 h-8 rounded" />
                        <span className="text-xs mt-1 truncate w-full text-center">{xinfa.name}</span>
                      </button>
                    );
                  })}
                </div>
              </ScrollShadow>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {value.length === 0 && <p className="text-xs text-default-400">可添加该角色会玩的其他心法（如DPS也会T/奶等）</p>}
    </div>
  );
}
