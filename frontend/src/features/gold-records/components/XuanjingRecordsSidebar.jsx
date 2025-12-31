import { format } from "date-fns";
import { Card, CardHeader, CardBody, Divider, Chip } from "@heroui/react";

/**
 * 玄晶记录侧边栏
 * @param {array} records - 玄晶记录列表（已拆分双闪）
 */
export default function XuanjingRecordsSidebar({ records = [] }) {
  /**
   * 格式化金额为"X砖Y金"
   */
  const formatGold = (copper) => {
    if (!copper) return "未知";
    const gold = Math.floor(copper / 10000);
    const remainder = copper % 10000;
    if (remainder === 0) {
      return `${gold}砖`;
    }
    return `${gold}砖${remainder}金`;
  };

  /**
   * 渲染黑本人信息
   */
  const renderHeibenren = (heibenrenInfo) => {
    if (!heibenrenInfo) return "未知";

    const { user_name, character_name } = heibenrenInfo;

    if (user_name && character_name) {
      return (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{user_name}</span>
          <span className="text-xs text-gray-500">{character_name}</span>
        </div>
      );
    }

    return user_name || character_name || "未知";
  };

  // 空状态
  if (records.length === 0) {
    return (
      <Card className="sticky top-4">
        <CardHeader>
          <h3 className="text-lg font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
            玄晶记录
          </h3>
        </CardHeader>
        <Divider />
        <CardBody>
          <div className="text-center py-10">
            <div className="text-4xl mb-2">💎</div>
            <p className="text-default-500 text-sm">暂无玄晶记录</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <h3 className="text-lg font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
          玄晶记录
        </h3>
      </CardHeader>
      <Divider />
      <CardBody className="max-h-[800px] overflow-y-auto space-y-2">
        {records.map((record) => (
          <Card
            key={`${record.id}_${record.order || 1}`}
            shadow="sm"
            className="border border-yellow-200 dark:border-yellow-900"
          >
            <CardBody className="p-3">
              {/* 日期 */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">{format(new Date(record.run_date), "yyyy-MM-dd")}</span>
                {record.isDouble && (
                  <Chip size="sm" color="warning" variant="flat">
                    双闪
                  </Chip>
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                {/* 黑本人 */}
                <div className="mb-2">{renderHeibenren(record.heibenren_info)}</div>

                {/* 玄晶序号与价格 */}
                <span className="text-lg font-bold text-warning">{formatGold(record.xuanjing)}</span>
              </div>
            </CardBody>
          </Card>
        ))}
      </CardBody>
    </Card>
  );
}
