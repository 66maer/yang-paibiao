import { useMemo } from "react";
import { Card, CardBody } from "@heroui/react";
import DropPieChart from "./DropPieChart";
import { xinfaInfoTable } from "../../config/xinfa";

/**
 * 掉落分布图表容器
 * @param {array} records - 金团记录列表
 */
export default function DropDistributionCharts({ records = [] }) {
  /**
   * 解析掉落物品字符串，移除状态前缀和心法后缀
   */
  const parseDropItem = (dropStr) => {
    // 移除状态前缀
    const cleanStr = dropStr.replace(/^【高价】|^【烂了】/, "");
    // 移除心法后缀
    const name = cleanStr.replace(/\(.*?\)$/, "");
    return name;
  };

  /**
   * 解析掉落物品字符串，提取心法
   */
  const parseXinfa = (dropStr) => {
    const match = dropStr.match(/\((.+?)\)$/);
    return match ? match[1] : null;
  };

  /**
   * 提取特效腰坠数据
   */
  const waistDropsData = useMemo(() => {
    const waistTypes = ["根骨腰坠", "元气腰坠", "力道腰坠", "身法腰坠", "T腰坠", "奶腰坠"];
    const counts = {};

    records.forEach((record) => {
      (record.special_drops || []).forEach((drop) => {
        const name = parseDropItem(drop);
        if (waistTypes.includes(name)) {
          counts[name] = (counts[name] || 0) + 1;
        }
      });
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [records]);

  /**
   * 提取特效武器数据（按心法区分，带颜色）
   */
  const weaponDropsData = useMemo(() => {
    const weaponKeywords = ["特效武器盒子", "特效武器"];
    const counts = {};

    records.forEach((record) => {
      (record.special_drops || []).forEach((drop) => {
        const name = parseDropItem(drop);
        const xinfa = parseXinfa(drop);

        if (weaponKeywords.some((kw) => name.includes(kw))) {
          // 跳过特效武器盒子，不参与统计
          if (name === "特效武器盒子") {
            return;
          }

          let itemName;
          let itemColor;

          if (xinfa) {
            // 特效武器：按心法区分
            // 直接通过 key 查找心法信息（与表格中的处理一致）
            const xinfaInfo = xinfaInfoTable[xinfa];

            if (xinfaInfo) {
              itemName = `特效武器(${xinfaInfo.name})`;
              itemColor = xinfaInfo.color;
            } else {
              // 如果找不到心法信息，使用原始名称
              itemName = `特效武器(${xinfa})`;
              itemColor = "#666666";
            }
          } else {
            // 没有心法信息的特效武器
            itemName = "特效武器(未填写)";
            itemColor = "#666666";
          }

          if (!counts[itemName]) {
            counts[itemName] = { value: 0, itemStyle: { color: itemColor } };
          }
          counts[itemName].value += 1;
        }
      });
    });

    return Object.entries(counts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.value - a.value);
  }, [records]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* 特效腰坠饼图 */}
      <Card>
        <CardBody>
          <DropPieChart title="特效腰坠掉落分布" data={waistDropsData} />
        </CardBody>
      </Card>

      {/* 特效武器饼图 */}
      <Card>
        <CardBody>
          <DropPieChart title="特效武器掉落分布" data={weaponDropsData} />
        </CardBody>
      </Card>
    </div>
  );
}
