import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Select,
  SelectItem,
  Button,
  Input,
  Tooltip,
  Spinner,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@heroui/react";
import { showToast } from "@/utils/toast";
import {
  getWeeklyMatrix,
  getWeekList,
  updateWeeklyColumns,
  createWeeklyRecord,
  updateWeeklyRecord,
} from "@/api/weeklyRecords";
import { xinfaInfoTable } from "@/config/xinfa";

/**
 * 格式化金额显示
 */
const formatGold = (amount) => {
  if (!amount) return "-";
  if (amount >= 10000) {
    const bricks = Math.floor(amount / 10000);
    const remainder = amount % 10000;
    return remainder > 0 ? `${bricks}砖${remainder}金` : `${bricks}砖`;
  }
  return amount.toLocaleString();
};

/**
 * 单元格组件 - 内联编辑
 */
function RecordCell({ cell, characterId, dungeonName, weekStart, isCurrentWeek, onUpdate }) {
  const [isCleared, setIsCleared] = useState(cell.is_cleared);
  const [goldAmount, setGoldAmount] = useState(cell.gold_amount || "");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setIsCleared(cell.is_cleared);
    setGoldAmount(cell.gold_amount || "");
  }, [cell]);

  const handleClearToggle = async () => {
    if (saving) return;
    setSaving(true);

    try {
      const newCleared = !isCleared;
      setIsCleared(newCleared);

      if (cell.record_id) {
        await updateWeeklyRecord(cell.record_id, { is_cleared: newCleared });
      } else {
        await createWeeklyRecord(
          {
            character_id: characterId,
            dungeon_name: dungeonName,
            is_cleared: newCleared,
            gold_amount: parseInt(goldAmount) || 0,
          },
          weekStart
        );
      }
      onUpdate();
    } catch (error) {
      setIsCleared(!isCleared);
      showToast.error("更新失败");
    } finally {
      setSaving(false);
    }
  };

  const handleGoldSave = async () => {
    if (saving) return;
    setSaving(true);

    try {
      const amount = parseInt(goldAmount) || 0;
      if (cell.record_id) {
        await updateWeeklyRecord(cell.record_id, { gold_amount: amount });
      } else {
        await createWeeklyRecord(
          {
            character_id: characterId,
            dungeon_name: dungeonName,
            is_cleared: isCleared,
            gold_amount: amount,
          },
          weekStart
        );
      }
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      showToast.error("更新失败");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleGoldSave();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setGoldAmount(cell.gold_amount || "");
    }
  };

  return (
    <div
      className={`p-1 text-center min-w-[80px] transition-colors ${
        isCleared ? "bg-success-100 dark:bg-success-900/30" : ""
      }`}
    >
      <div className="flex flex-col items-center gap-1">
        {/* 通关状态按钮 */}
        <button
          onClick={handleClearToggle}
          disabled={saving}
          className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
            isCleared ? "bg-success text-white" : "bg-default-100 hover:bg-default-200 text-default-400"
          }`}
        >
          {saving ? <Spinner size="sm" color="current" /> : isCleared ? "✓" : "○"}
        </button>

        {/* 金额显示/编辑 */}
        {isEditing ? (
          <Input
            size="sm"
            type="number"
            value={goldAmount}
            onChange={(e) => setGoldAmount(e.target.value)}
            onBlur={handleGoldSave}
            onKeyDown={handleKeyDown}
            className="w-24"
            autoFocus
          />
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs text-default-500 hover:text-primary min-w-[40px]"
          >
            {formatGold(cell.gold_amount)}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * 列管理模态框
 */
function ColumnEditorModal({ isOpen, onClose, columns, onSave, primaryDungeons }) {
  const [editColumns, setEditColumns] = useState([]);
  const [newColumnName, setNewColumnName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEditColumns([...columns]);
  }, [columns, isOpen]);

  const handleAddColumn = () => {
    if (!newColumnName.trim()) return;
    if (editColumns.find((c) => c.name === newColumnName.trim())) {
      showToast.error("该副本列已存在");
      return;
    }
    setEditColumns([...editColumns, { name: newColumnName.trim(), type: "custom", order: editColumns.length }]);
    setNewColumnName("");
  };

  const handleRemoveColumn = (index) => {
    const col = editColumns[index];
    if (col.type === "primary") {
      showToast.error("主要副本列不可删除");
      return;
    }
    setEditColumns(editColumns.filter((_, i) => i !== index));
  };

  const handleMoveColumn = (index, direction) => {
    const newColumns = [...editColumns];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newColumns.length) return;
    [newColumns[index], newColumns[targetIndex]] = [newColumns[targetIndex], newColumns[index]];
    setEditColumns(newColumns.map((col, i) => ({ ...col, order: i })));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(editColumns);
      onClose();
    } catch (error) {
      showToast.error(error.response?.data?.detail || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalContent>
        <ModalHeader>编辑列配置</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {/* 当前列列表 */}
            <div className="space-y-2">
              {editColumns.map((col, index) => (
                <div key={col.name} className="flex items-center gap-2 p-2 bg-default-100 rounded">
                  <span className="flex-1">
                    {col.name}
                    {col.type === "primary" && (
                      <Chip size="sm" color="primary" variant="flat" className="ml-2">
                        主要
                      </Chip>
                    )}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="light"
                      isIconOnly
                      onClick={() => handleMoveColumn(index, -1)}
                      isDisabled={index === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      size="sm"
                      variant="light"
                      isIconOnly
                      onClick={() => handleMoveColumn(index, 1)}
                      isDisabled={index === editColumns.length - 1}
                    >
                      ↓
                    </Button>
                    <Button
                      size="sm"
                      variant="light"
                      isIconOnly
                      color="danger"
                      onClick={() => handleRemoveColumn(index)}
                      isDisabled={col.type === "primary"}
                    >
                      ×
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* 新增列 */}
            <div className="flex gap-2">
              <Input
                size="sm"
                placeholder="输入副本名称"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddColumn()}
              />
              <Button size="sm" color="primary" onClick={handleAddColumn}>
                添加
              </Button>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onClick={onClose}>
            取消
          </Button>
          <Button color="primary" onClick={handleSave} isLoading={saving}>
            保存
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/**
 * 我的记录页面
 */
export default function MyRecordsPage() {
  // 状态
  const [loading, setLoading] = useState(true);
  const [matrixData, setMatrixData] = useState(null);
  const [weekList, setWeekList] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [sortDescriptor, setSortDescriptor] = useState({
    column: "character",
    direction: "ascending",
  });
  const { isOpen, onOpen, onClose } = useDisclosure();

  // 加载周列表
  const loadWeekList = useCallback(async () => {
    try {
      const response = await getWeekList(12);
      const weeks = response.data || response;
      setWeekList(weeks);
      // 默认选择当前周
      const currentWeek = weeks.find((w) => w.is_current);
      if (currentWeek) {
        setSelectedWeek(currentWeek.week_start_date);
      } else if (weeks.length > 0) {
        setSelectedWeek(weeks[0].week_start_date);
      }
    } catch (error) {
      console.error("加载周列表失败:", error);
      showToast.error("加载周列表失败");
    }
  }, []);

  // 加载矩阵数据
  const loadMatrixData = useCallback(async () => {
    if (!selectedWeek) return;

    setLoading(true);
    try {
      const response = await getWeeklyMatrix(selectedWeek);
      setMatrixData(response.data || response);
    } catch (error) {
      console.error("加载记录失败:", error);
      showToast.error("加载记录失败");
    } finally {
      setLoading(false);
    }
  }, [selectedWeek]);

  useEffect(() => {
    loadWeekList();
  }, [loadWeekList]);

  useEffect(() => {
    loadMatrixData();
  }, [loadMatrixData]);

  // 处理列更新
  const handleColumnsUpdate = async (columns) => {
    await updateWeeklyColumns(columns);
    await loadMatrixData();
    showToast.success("列配置已更新");
  };

  // 获取心法信息
  const getXinfaInfo = (xinfaKey) => {
    return xinfaInfoTable[xinfaKey] || null;
  };

  // 主要副本列表（用于判断哪些不能删除）
  const primaryDungeons = useMemo(() => {
    if (!matrixData?.columns) return [];
    return matrixData.columns.filter((c) => c.type === "primary").map((c) => c.name);
  }, [matrixData]);

  // 排序后的行数据
  const sortedRows = useMemo(() => {
    if (!matrixData?.rows) return [];

    const rows = [...matrixData.rows];

    if (sortDescriptor.column === "character") {
      rows.sort((a, b) => {
        // 先按心法排序
        const xinfaA = a.character.xinfa || "";
        const xinfaB = b.character.xinfa || "";
        const xinfaCompare = xinfaA.localeCompare(xinfaB, "zh-CN");

        if (xinfaCompare !== 0) {
          return sortDescriptor.direction === "ascending" ? xinfaCompare : -xinfaCompare;
        }

        // 心法相同，再按名称排序
        const nameA = a.character.name || "";
        const nameB = b.character.name || "";
        const nameCompare = nameA.localeCompare(nameB, "zh-CN");
        return sortDescriptor.direction === "ascending" ? nameCompare : -nameCompare;
      });
    }

    return rows;
  }, [matrixData?.rows, sortDescriptor]);

  if (loading && !matrixData) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-6xl mx-auto">
          <CardBody className="flex items-center justify-center py-20">
            <Spinner size="lg" />
            <p className="mt-4 text-default-500">加载中...</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 px-2">
      <Card className="max-w-7xl mx-auto">
        <CardHeader className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <h1 className="text-xl font-bold">我的记录</h1>
            <p className="text-sm text-default-500">记录每周副本通关与金团收入</p>
          </div>

          <div className="flex gap-2 items-center">
            {/* 列管理按钮（仅当前周可用） */}
            {matrixData?.is_current_week && (
              <Button size="sm" variant="flat" color="primary" onClick={onOpen}>
                编辑列
              </Button>
            )}
            {/* 周选择器 */}
            <Select
              size="sm"
              selectedKeys={selectedWeek ? [selectedWeek] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0];
                if (selected) setSelectedWeek(selected);
              }}
              className="w-65"
              label="选择周"
            >
              {weekList.map((week) => (
                <SelectItem key={week.week_start_date} textValue={`${week.label}${week.is_current ? " (本周)" : ""}`}>
                  {week.label} {week.is_current && "(本周)"}
                </SelectItem>
              ))}
            </Select>
          </div>
        </CardHeader>

        <CardBody className="overflow-x-auto">
          {!matrixData?.rows?.length ? (
            <div className="text-center py-10 text-default-500">
              <p>暂无角色数据</p>
              <p className="text-sm mt-2">请先在角色管理中添加角色</p>
            </div>
          ) : (
            <Table
              aria-label="我的记录表格"
              sortDescriptor={sortDescriptor}
              onSortChange={setSortDescriptor}
              classNames={{
                wrapper: "p-0",
                table: "border-collapse",
                th: "border border-default-200 bg-default-100 text-sm",
                td: "border border-default-200",
              }}
            >
              <TableHeader>
                <TableColumn key="character" allowsSorting className="text-left min-w-[120px]">
                  角色
                </TableColumn>
                {matrixData.columns.map((col) => (
                  <TableColumn key={col.name} className="text-center min-w-[80px]">
                    <Tooltip content={col.type === "primary" ? "主要副本" : "自定义副本"}>
                      <span>{col.name}</span>
                    </Tooltip>
                  </TableColumn>
                ))}
                <TableColumn key="row_total" className="text-center min-w-[80px] bg-primary-100 dark:bg-primary-900/30">
                  行合计
                </TableColumn>
              </TableHeader>
              <TableBody>
                {sortedRows.map((row) => {
                  const xinfa = getXinfaInfo(row.character.xinfa);
                  return (
                    <TableRow key={row.character.id} className="hover:bg-default-50">
                      {/* 角色列 */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {xinfa && <img src={`/xinfa/${xinfa.icon}`} alt={xinfa.name} className="w-6 h-6 rounded" />}
                          <div>
                            <div className="font-medium text-sm">{row.character.name}</div>
                            <div className="text-xs text-default-400">{row.character.server}</div>
                          </div>
                        </div>
                      </TableCell>

                      {/* 副本单元格 */}
                      {matrixData.columns.map((col) => (
                        <TableCell key={`${row.character.id}-${col.name}`}>
                          <RecordCell
                            cell={row.cells[col.name] || {}}
                            characterId={row.character.id}
                            dungeonName={col.name}
                            weekStart={selectedWeek}
                            isCurrentWeek={matrixData.is_current_week}
                            onUpdate={loadMatrixData}
                          />
                        </TableCell>
                      ))}

                      {/* 行合计 */}
                      <TableCell className="text-center font-medium bg-primary-50 dark:bg-primary-900/20">
                        {formatGold(row.row_total)}
                      </TableCell>
                    </TableRow>
                  );
                })}

                {/* 列合计行 */}
                <TableRow key="totals" className="bg-primary-100 dark:bg-primary-900/30 font-medium">
                  <TableCell>列合计</TableCell>
                  {matrixData.columns.map((col) => (
                    <TableCell key={`total-${col.name}`} className="text-center">
                      {formatGold(matrixData.column_totals[col.name])}
                    </TableCell>
                  ))}
                  <TableCell className="text-center text-lg bg-success-100 dark:bg-success-900/30">
                    <Tooltip content="本周总收入">
                      <span className="text-success-600 dark:text-success-400">
                        {formatGold(matrixData.grand_total)}
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* 列编辑模态框 */}
      <ColumnEditorModal
        isOpen={isOpen}
        onClose={onClose}
        columns={matrixData?.columns || []}
        onSave={handleColumnsUpdate}
        primaryDungeons={primaryDungeons}
      />
    </div>
  );
}
