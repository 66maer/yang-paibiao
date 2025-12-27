import { useState, useEffect } from "react";
import { Select, SelectItem } from "@heroui/react";
import { getDungeonOptions } from "../../../api/configs";

/**
 * 副本选择器（模态框版本）
 * @param {string} value - 选中的副本
 * @param {function} onChange - 变化回调
 * @param {boolean} isRequired - 是否必填
 */
export default function DungeonSelector({ value, onChange, isRequired = true }) {
  const [dungeons, setDungeons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDungeons();
  }, []);

  const loadDungeons = async () => {
    try {
      // 获取所有副本（不限制类型）
      const response = await getDungeonOptions();
      // 后端返回格式：{options: [{name, type, order}, ...]}
      // 按 order 排序
      const sortedDungeons = (response.options || []).sort((a, b) => a.order - b.order);
      setDungeons(sortedDungeons);
    } catch (error) {
      console.error("加载副本列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Select
      label="副本"
      placeholder="选择副本"
      selectedKeys={value ? [value] : []}
      onSelectionChange={(keys) => {
        const selected = Array.from(keys)[0];
        onChange(selected || "");
      }}
      isLoading={loading}
      isRequired={isRequired}
    >
      {dungeons.map((dungeon) => (
        <SelectItem key={dungeon.name} value={dungeon.name}>
          {dungeon.name}
        </SelectItem>
      ))}
    </Select>
  );
}
