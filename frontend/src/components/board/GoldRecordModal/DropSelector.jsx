import { useState } from "react";
import { Chip, Checkbox } from "@heroui/react";
import XinfaSelector from "../../XinfaSelector";
import GoldAmountInput from "./GoldAmountInput";
import { goldDropConfig } from "../goldDropConfig";
import { xinfaInfoTable } from "../../../config/xinfa";

/**
 * 掉落选择列表组件
 * 支持4状态循环：未选中 → 普通 → 高价 → 烂了 → 未选中
 *
 * @param {Map} selectedDrops - 已选掉落Map<key, {name, status, xinfa?, xuanjing?}>
 * @param {function} onChange - 变化回调
 */
export default function DropSelector({ selectedDrops, onChange }) {
  // 跟踪当前正在选择心法的物品 (用于展开心法选择器)
  const [expandedXinfaDrop, setExpandedXinfaDrop] = useState(null);
  // 跟踪当前正在编辑的玄晶物品 (用于展开玄晶编辑器)
  const [expandedXuanjingDrop, setExpandedXuanjingDrop] = useState(null);

  // 根据状态返回Chip的样式和显示文本
  const getChipStyle = (item, status, xinfaName, xuanjingData) => {
    const prefix = {
      none: "",
      normal: "",
      expensive: "【高价】",
      bad: "【烂了】",
    }[status];

    // 如果有心法，在名称后添加
    let nameSuffix = xinfaName ? `(${xinfaName})` : "";

    // 如果是玄晶，显示价格信息
    if (item.extraContent === "xuanjing" && xuanjingData) {
      const formatGold = (val) => {
        if (!val || val === 0) return "";
        const zhuans = Math.floor(val / 10000);
        const golds = val % 10000;
        if (zhuans === 0) return `${golds}金`;
        if (golds === 0) return `${zhuans}砖`;
        return `${zhuans}砖${golds}金`;
      };

      if (xuanjingData.second) {
        nameSuffix = `(${formatGold(xuanjingData.first)}+${formatGold(xuanjingData.second)})`;
      } else if (xuanjingData.first) {
        nameSuffix = `(${formatGold(xuanjingData.first)})`;
      }
    }

    const baseStyle = {
      none: { variant: "flat", className: "cursor-pointer" },
      normal: { variant: "solid", className: "cursor-pointer" },
      expensive: { variant: "solid", className: "cursor-pointer border-2 border-red-500" },
      bad: { variant: "solid", className: "cursor-pointer border-2 border-gray-400" },
    }[status];

    // 应用自定义样式
    let className = baseStyle.className;
    let baseClassName = "";
    if (item.customStyle && status !== "none") {
      const { className: customClassName, gradient, animation, useSuperEffect } = item.customStyle;

      // 如果启用超级特效，直接应用组合类
      if (useSuperEffect) {
        baseClassName += " xuanjing-super-effect";
      } else {
        // 否则按单独配置应用
        // 添加自定义类名
        if (customClassName) {
          baseClassName += ` ${customClassName}`;
        }

        // 添加渐变效果类
        if (gradient) {
          baseClassName += " xuanjing-gradient";
        }

        // 添加动画效果类
        if (animation) {
          baseClassName += ` xuanjing-animation-${animation}`;
        }
      }
    }

    return {
      text: prefix + item.name + nameSuffix,
      variant: baseStyle.variant,
      className,
      classNames: baseClassName ? { base: baseClassName } : undefined,
    };
  };

  // 处理掉落点击 - 切换状态
  const handleDropClick = (rowIndex, groupIndex, itemIndex, item) => {
    const key = `${rowIndex}_${groupIndex}_${itemIndex}`;
    const currentData = selectedDrops.get(key);
    const currentStatus = currentData?.status || "none";

    // 状态循环：none → normal → expensive → bad → none
    const statusFlow = {
      none: "normal",
      normal: "expensive",
      expensive: "bad",
      bad: "none",
    };
    const nextStatus = statusFlow[currentStatus];

    // 更新状态
    const newDrops = new Map(selectedDrops);
    if (nextStatus === "none") {
      newDrops.delete(key);
      // 如果删除了，也要关闭心法选择器和玄晶编辑器
      if (expandedXinfaDrop === key) {
        setExpandedXinfaDrop(null);
      }
      if (expandedXuanjingDrop === key) {
        setExpandedXuanjingDrop(null);
      }
    } else {
      newDrops.set(key, {
        name: item.name,
        status: nextStatus,
        xinfa: currentData?.xinfa,
        xuanjing: currentData?.xuanjing,
      });

      // 如果这个物品需要心法，展开心法选择器
      if (item.extraContent === "xinfa") {
        setExpandedXinfaDrop(key);
      }
      // 如果这个物品是玄晶，展开玄晶编辑器
      if (item.extraContent === "xuanjing") {
        setExpandedXuanjingDrop(key);
      }
    }
    onChange(newDrops);
  };

  // 处理心法选择变化
  const handleXinfaChange = (key, xinfaKey) => {
    const currentData = selectedDrops.get(key);
    if (!currentData) return;

    const newDrops = new Map(selectedDrops);
    newDrops.set(key, {
      ...currentData,
      xinfa: xinfaKey,
    });
    onChange(newDrops);
  };

  // 处理玄晶价格变化
  const handleXuanjingPriceChange = (key, field, value) => {
    const currentData = selectedDrops.get(key);
    if (!currentData) return;

    const newDrops = new Map(selectedDrops);
    newDrops.set(key, {
      ...currentData,
      xuanjing: {
        ...currentData.xuanjing,
        [field]: value,
      },
    });
    onChange(newDrops);
  };

  // 处理双闪复选框变化
  const handleDoubleShanChange = (key, isChecked) => {
    const currentData = selectedDrops.get(key);
    if (!currentData) return;

    const newDrops = new Map(selectedDrops);
    if (!isChecked) {
      // 取消双闪时，删除 second 字段
      const { second, ...rest } = currentData.xuanjing || {};
      newDrops.set(key, {
        ...currentData,
        xuanjing: rest,
      });
    } else {
      // 勾选双闪时，初始化 second 字段
      newDrops.set(key, {
        ...currentData,
        xuanjing: {
          ...currentData.xuanjing,
          second: 0,
        },
      });
    }
    onChange(newDrops);
  };

  return (
    <div className="space-y-4">
      <div className="text-sm font-semibold">特殊掉落</div>
      {goldDropConfig.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-8">
          {row.map((group, groupIndex) => (
            <div key={group.title} className="space-y-2">
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400">{group.title}</div>
              <div className="flex flex-wrap gap-2 items-start">
                {group.items.map((item, itemIndex) => {
                  const key = `${rowIndex}_${groupIndex}_${itemIndex}`;
                  const dropData = selectedDrops.get(key);
                  const status = dropData?.status || "none";

                  // 获取心法名称（如果有）
                  const xinfaName = dropData?.xinfa ? xinfaInfoTable[dropData.xinfa]?.name : null;
                  // 获取玄晶数据（如果有）
                  const xuanjingData = dropData?.xuanjing;
                  const chipStyle = getChipStyle(item, status, xinfaName, xuanjingData);

                  const needsXinfa = item.extraContent === "xinfa" && status !== "none";
                  const isXinfaExpanded = expandedXinfaDrop === key;

                  const needsXuanjing = item.extraContent === "xuanjing" && status !== "none";
                  const isXuanjingExpanded = expandedXuanjingDrop === key;

                  // 如果需要显示心法选择器，使用相对定位布局
                  if (needsXinfa && isXinfaExpanded) {
                    return (
                      <div key={key} className="relative inline-flex">
                        <Chip
                          color={item.color}
                          variant={chipStyle.variant}
                          className={chipStyle.className}
                          classNames={chipStyle.classNames}
                          onClick={() => handleDropClick(rowIndex, groupIndex, itemIndex, item)}
                        >
                          {chipStyle.text}
                        </Chip>
                        {/* 内联心法选择器 - 绝对定位，不影响布局高度 */}
                        <div className="absolute left-full ml-2 top-0 w-48 z-10">
                          <XinfaSelector
                            label="心法"
                            value={dropData?.xinfa || ""}
                            onChange={(xinfaKey) => handleXinfaChange(key, xinfaKey)}
                            variant="bordered"
                            size="sm"
                          />
                        </div>
                      </div>
                    );
                  }

                  // 如果需要显示玄晶编辑器，在同一行显示
                  if (needsXuanjing && isXuanjingExpanded) {
                    const hasSecond = xuanjingData?.second !== undefined;
                    return (
                      <div key={key} className="flex items-center gap-2 flex-wrap">
                        <Chip
                          color={item.color}
                          variant={chipStyle.variant}
                          className={chipStyle.className}
                          classNames={chipStyle.classNames}
                          onClick={() => handleDropClick(rowIndex, groupIndex, itemIndex, item)}
                        >
                          {chipStyle.text}
                        </Chip>
                        <div className="w-32">
                          <GoldAmountInput
                            label={hasSecond ? "第一块" : "价格"}
                            value={xuanjingData?.first || 0}
                            onChange={(value) => handleXuanjingPriceChange(key, "first", value)}
                          />
                        </div>
                        <Checkbox
                          size="sm"
                          isSelected={hasSecond}
                          onValueChange={(checked) => handleDoubleShanChange(key, checked)}
                        >
                          双闪
                        </Checkbox>
                        {hasSecond && (
                          <div className="w-32">
                            <GoldAmountInput
                              label="第二块"
                              value={xuanjingData?.second || 0}
                              onChange={(value) => handleXuanjingPriceChange(key, "second", value)}
                            />
                          </div>
                        )}
                      </div>
                    );
                  }

                  // 普通 Chip，直接渲染
                  return (
                    <Chip
                      key={key}
                      color={item.color}
                      variant={chipStyle.variant}
                      className={chipStyle.className}
                      classNames={chipStyle.classNames}
                      onClick={() => handleDropClick(rowIndex, groupIndex, itemIndex, item)}
                    >
                      {chipStyle.text}
                    </Chip>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
