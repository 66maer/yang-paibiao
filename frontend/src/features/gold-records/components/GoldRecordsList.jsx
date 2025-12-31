import { format } from "date-fns";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Button, Spinner } from "@heroui/react";
import { goldDropConfig } from "@/features/board/config/goldDropConfig";
import { xinfaInfoTable } from "@/config/xinfa";

/**
 * 金团记录列表
 * @param {array} records - 金团记录列表
 * @param {boolean} loading - 加载状态
 * @param {function} onEdit - 编辑回调
 * @param {boolean} isAdmin - 是否是管理员
 * @param {number} currentUserId - 当前用户ID
 */
export default function GoldRecordsList({ records = [], loading, onEdit, isAdmin, currentUserId }) {
  /**
   * 根据物品名称查找在配置中的颜色和自定义样式
   */
  const getDropConfig = (itemName) => {
    // 清理物品名称（去除状态前缀和特效武器的心法后缀）
    const cleanName = itemName.replace(/^【高价】|^【烂了】/, "").replace(/\(.*\)$/, "");

    // 特殊处理玄晶
    if (cleanName === "玄晶") {
      // 从配置中查找玄晶的完整配置
      for (const row of goldDropConfig) {
        for (const group of row) {
          const found = group.items.find((item) => item.name === cleanName);
          if (found) return { color: found.color, customStyle: found.customStyle };
        }
      }
      return { color: "warning", customStyle: null };
    }

    // 在配置中查找
    for (const row of goldDropConfig) {
      for (const group of row) {
        const found = group.items.find((item) => item.name === cleanName);
        if (found) return { color: found.color, customStyle: found.customStyle };
      }
    }

    // 默认配置
    return { color: "primary", customStyle: null };
  };

  /**
   * 格式化金额为"X砖Y金"
   */
  const formatGold = (copper) => {
    const gold = Math.floor(copper / 10000);
    const remainder = copper % 10000;
    if (remainder === 0) {
      return `${gold}砖`;
    }
    return `${gold}砖${remainder}金`;
  };

  /**
   * 渲染掉落标签（完全显示，不省略）
   */
  const renderDrops = (drops, has_xuanjing) => {
    const allDrops = [...(drops || [])];

    // 如果有玄晶，添加玄晶标签
    if (has_xuanjing) {
      allDrops.unshift("玄晶");
    }

    if (allDrops.length === 0) {
      return <span className="text-gray-400 text-sm">无</span>;
    }

    return (
      <div className="flex flex-wrap gap-1">
        {allDrops.map((drop, idx) => {
          // 提取状态前缀
          const statusPrefix = drop.match(/^【高价】|^【烂了】/)?.[0] || "";
          const cleanDrop = drop.replace(/^【高价】|^【烂了】/, "");

          // 解析特效武器的心法名称
          let displayText = cleanDrop;
          if (cleanDrop.startsWith("特效武器(") && cleanDrop.endsWith(")")) {
            const xinfaKey = cleanDrop.match(/特效武器\((.+)\)/)?.[1];
            console.log("解析特效武器心法:", cleanDrop, xinfaKey);
            if (xinfaKey && xinfaInfoTable[xinfaKey]) {
              displayText = `特效武器(${xinfaInfoTable[xinfaKey].name})`;
            }
          }

          // 拼接状态前缀
          displayText = statusPrefix + displayText;

          // 获取配置（颜色和自定义样式）
          const { color, customStyle } = getDropConfig(drop);

          // 构建classNames和variant
          let chipClassNames = undefined;
          let chipVariant = "flat";
          if (customStyle?.useSuperEffect) {
            chipClassNames = { base: "xuanjing-super-effect" };
            chipVariant = "solid"; // 特效需要solid变体才能正确显示背景
          }

          return (
            <Chip key={idx} size="sm" variant={chipVariant} color={color} classNames={chipClassNames}>
              {displayText}
            </Chip>
          );
        })}
      </div>
    );
  };

  /**
   * 渲染黑本人信息
   */
  const renderHeibenren = (heibenrenInfo) => {
    if (!heibenrenInfo) return <span className="text-gray-400 text-sm">未知</span>;

    const { user_name, character_name } = heibenrenInfo;

    if (user_name && character_name) {
      return (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{user_name}</span>
          <span className="text-xs text-gray-500">{character_name}</span>
        </div>
      );
    }

    return <span className="text-sm">{user_name || character_name || "未知"}</span>;
  };

  /**
   * 渲染操作按钮（只允许编辑）
   */
  const renderActions = (record) => {
    const canEdit = isAdmin || record.creator_id === currentUserId;

    if (!canEdit) return null;

    return (
      <Button size="sm" variant="flat" color="primary" onPress={() => onEdit(record)}>
        编辑
      </Button>
    );
  };

  // 空状态
  if (!loading && records.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">📝</div>
        <p className="text-default-500">暂无金团记录</p>
      </div>
    );
  }

  return (
    <Table
      aria-label="金团记录列表"
      classNames={{
        base: "max-h-[600px] overflow-auto",
        table: "min-h-[400px]",
      }}
    >
      <TableHeader>
        <TableColumn>序号</TableColumn>
        <TableColumn>日期</TableColumn>
        <TableColumn>副本</TableColumn>
        <TableColumn>总金额</TableColumn>
        <TableColumn>黑本人</TableColumn>
        <TableColumn>掉落详情</TableColumn>
        <TableColumn>操作</TableColumn>
      </TableHeader>
      <TableBody items={records} loadingContent={<Spinner />} loadingState={loading ? "loading" : "idle"}>
        {(record) => (
          <TableRow key={record.id}>
            <TableCell>
              <span className="text-sm font-medium text-default-600">{record.sequenceNumber || "-"}</span>
            </TableCell>
            <TableCell>
              <span className="text-sm">{format(new Date(record.run_date), "yyyy-MM-dd")}</span>
            </TableCell>
            <TableCell>
              <span className="text-sm font-medium">{record.dungeon}</span>
            </TableCell>
            <TableCell>
              <span className="text-sm font-semibold text-primary">{formatGold(record.total_gold)}</span>
            </TableCell>
            <TableCell>{renderHeibenren(record.heibenren_info)}</TableCell>
            <TableCell className="min-w-[200px]">{renderDrops(record.special_drops, record.has_xuanjing)}</TableCell>
            <TableCell>{renderActions(record)}</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
