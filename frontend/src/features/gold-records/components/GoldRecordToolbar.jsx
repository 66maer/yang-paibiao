import { useState, useEffect } from "react";
import { Select, SelectItem, Button, Card, CardBody } from "@heroui/react";
import { getDungeonOptions } from "@/api/configs";

/**
 * 金团记录工具栏
 * @param {string} selectedDungeon - 选中的副本
 * @param {function} onDungeonChange - 副本变化回调
 * @param {function} onCreateClick - 新增按钮点击回调
 * @param {function} onDungeonsLoaded - 副本列表加载完成回调
 */
export default function GoldRecordToolbar({ selectedDungeon, onDungeonChange, onCreateClick, onDungeonsLoaded }) {
  const [dungeons, setDungeons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDungeons();
  }, []);

  const loadDungeons = async () => {
    try {
      // 获取所有副本（不限制类型）
      const response = await getDungeonOptions();
      // 后端返回的数据格式：{options: [{name, type, order}, ...]}
      // 转换为选择器需要的格式
      const dungeonList = (response.options || [])
        .sort((a, b) => a.order - b.order)
        .map((d) => ({
          value: d.name,
          label: d.name,
        }));

      setDungeons(dungeonList);

      // 通知父组件副本列表已加载，并传递第一个副本
      if (dungeonList.length > 0 && onDungeonsLoaded) {
        onDungeonsLoaded(dungeonList);
      }
    } catch (error) {
      console.error("加载副本列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardBody>
        <div className="flex flex-wrap items-center gap-4">
          {/* 副本选择器 */}
          <div className="flex-1 min-w-[200px]">
            <Select
              label="副本筛选"
              placeholder="选择副本"
              selectedKeys={selectedDungeon ? [selectedDungeon] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0];
                if (selected) {
                  onDungeonChange(selected);
                }
              }}
              isLoading={loading}
              isRequired
              isDisabled={dungeons.length === 0}
              classNames={{
                base: "max-w-xs",
              }}
            >
              {dungeons.map((dungeon) => (
                <SelectItem key={dungeon.value} value={dungeon.value}>
                  {dungeon.label}
                </SelectItem>
              ))}
            </Select>
          </div>

          {/* 新增按钮 */}
          <Button color="primary" className="bg-gradient-to-r from-pink-500 to-purple-500" onPress={onCreateClick}>
            新增金团记录
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
