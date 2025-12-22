import { Chip, Avatar } from "@heroui/react";
import {
  allXinfaList,
  dpsXinfaList,
  naiXinfaList,
  tXinfaList,
  neigongXinfaList,
  waigongXinfaList,
  xinfaInfoTable,
} from "../../../../config/xinfa";

/**
 * 规则标签组件
 * 根据规则显示不同的标签样式
 * - 未开放：不允许老板且无心法限制
 * - 只允许老板：允许老板且无心法限制
 * - 只允许打工：不允许老板但允许心法
 * - 老板或打工：允许老板且允许心法（用"或"括号连接）
 */
const RuleTag = ({ rule }) => {
  const { allowRich = false, allowXinfaList = [] } = rule;

  // 根据图标数量返回尺寸类名（返回对象：xinfa心法尺寸, rich老板尺寸比心法大一级）
  const getAvatarSizes = (count) => {
    if (count <= 3) return { xinfa: "w-10 h-10", rich: "w-11 h-11" }; // 40px / 44px
    if (count <= 6) return { xinfa: "w-8 h-8", rich: "w-9 h-9" };     // 32px / 36px
    if (count <= 9) return { xinfa: "w-6 h-6", rich: "w-7 h-7" };     // 24px / 28px
    return { xinfa: "w-5 h-5", rich: "w-6 h-6" };                     // 20px / 24px
  };

  // 检查心法内容类型
  const getXinfaContentType = (xinfaList) => {
    // 不限心法
    if (xinfaList.length === allXinfaList.length) {
      return { type: "simple", iconUrl: "/jx3.png", label: "不限心法" };
    }

    // 检查是否匹配特定心法组
    const checkGroup = (name, refList, iconUrl, label) => {
      if (
        xinfaList.length === refList.length &&
        xinfaList.every((xinfa) => xinfaInfoTable[xinfa].type.includes(name))
      ) {
        return { type: "simple", iconUrl, label };
      }
      return null;
    };

    // 按优先级检查各种心法组
    let result = null;
    if ((result = checkGroup("dps", dpsXinfaList, "/dps.svg", "任意输出心法"))) return result;
    if ((result = checkGroup("奶妈", naiXinfaList, "/奶妈.svg", "任意治疗心法"))) return result;
    if ((result = checkGroup("T", tXinfaList, "/T.svg", "任意防御心法"))) return result;
    if ((result = checkGroup("内功", neigongXinfaList, "/内功.svg", "任意内功心法"))) return result;
    if ((result = checkGroup("外功", waigongXinfaList, "/外功.svg", "任意外功心法"))) return result;

    // 多个心法图标
    return { type: "multiple", xinfaList };
  };

  // 1. 未开放：不允许老板且无心法限制
  if (!allowRich && allowXinfaList.length === 0) {
    return (
      <Chip size="lg" color="default" variant="flat">
        未开放
      </Chip>
    );
  }

  // 2. 只允许老板：允许老板且无心法限制
  if (allowRich && allowXinfaList.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <img src="/rich.svg" alt="老板坑" className="w-10 h-10" />
        <span className="text-sm">老板坑</span>
      </div>
    );
  }

  // 3. 只允许打工：不允许老板但允许心法
  if (!allowRich && allowXinfaList.length > 0) {
    const contentType = getXinfaContentType(allowXinfaList);

    if (contentType.type === "simple") {
      return (
        <div className="flex items-center gap-2">
          <img src={contentType.iconUrl} alt={contentType.label} className="w-10 h-10" />
          <span className="text-sm">{contentType.label}</span>
        </div>
      );
    }

    // 多个心法图标
    const sizes = getAvatarSizes(contentType.xinfaList.length);

    return (
      <div className="flex flex-wrap items-center">
        {contentType.xinfaList.map((xinfa) => {
          const info = xinfaInfoTable[xinfa];
          return (
            <Avatar
              key={xinfa}
              src={`/xinfa/${info.icon}`}
              alt={info.name}
              size="sm"
              isBordered
              className={sizes.xinfa}
            />
          );
        })}
      </div>
    );
  }

  // 4. 老板或打工：允许老板且允许心法
  const contentType = getXinfaContentType(allowXinfaList);

  if (contentType.type === "simple") {
    // 简写形式：两行显示，左侧图标对齐
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <img src="/rich.svg" alt="老板坑" className="w-8 h-8" />
          <span className="text-sm">老板坑</span>
        </div>
        <div className="flex items-center gap-2">
          <img src={contentType.iconUrl} alt={contentType.label} className="w-8 h-8" />
          <span className="text-sm">{contentType.label}</span>
        </div>
      </div>
    );
  }

  // 多图标形式：单行显示，老板图标 + 分隔符 + 心法图标
  // 总数量 = 1个老板图标 + 心法数量
  const totalCount = 1 + contentType.xinfaList.length;
  const sizes = getAvatarSizes(totalCount);

  return (
    <div className="flex flex-wrap items-center">
      <img src="/rich.svg" alt="老板坑" className={sizes.rich} />
      <div className="w-px h-8 bg-gray-300 mx-2"></div>
      {contentType.xinfaList.map((xinfa) => {
        const info = xinfaInfoTable[xinfa];
        return (
          <Avatar
            key={xinfa}
            src={`/xinfa/${info.icon}`}
            alt={info.name}
            size="sm"
            isBordered
            className={sizes.xinfa}
          />
        );
      })}
    </div>
  );
};

export default RuleTag;
