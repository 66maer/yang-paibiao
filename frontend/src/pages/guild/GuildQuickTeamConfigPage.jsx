import { useState, useEffect } from "react";
import useSWR from "swr";
import { Reorder } from "framer-motion";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Spinner,
} from "@heroui/react";
import { getGuildQuickTeamOptions, updateGuildQuickTeamOptions } from "@/api/guildConfigs";
import { showSuccess, showError, showConfirm } from "@/utils/toast.jsx";

export default function GuildQuickTeamConfigPage() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editMode, setEditMode] = useState("add"); // 'add' or 'edit'
  const [editingIndex, setEditingIndex] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    label: "",
    hour: 19,
    minute: 30,
    order: 0,
  });

  // 获取快捷开团配置
  const { data, error, mutate } = useSWR("guild-quick-team-options", () => getGuildQuickTeamOptions(), {
    revalidateOnFocus: false,
  });

  const [options, setOptions] = useState([]);

  // 当数据加载完成时，更新本地状态
  useEffect(() => {
    if (data?.options) {
      setOptions(data.options);
    }
  }, [data]);

  // 格式化时间为 HH:MM
  const formatTime = (hour, minute) => {
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  };

  const handleAdd = () => {
    setEditMode("add");
    setEditForm({
      name: "",
      label: "",
      hour: 19,
      minute: 30,
      order: (options?.length || 0) + 1,
    });
    onOpen();
  };

  const handleEdit = (index) => {
    setEditMode("edit");
    setEditingIndex(index);
    setEditForm({ ...options[index] });
    onOpen();
  };

  const handleDelete = async (index) => {
    const option = options[index];
    const confirmed = await showConfirm(`确定要删除快捷选项 "${option.name}" 吗？`);
    if (!confirmed) return;

    const newOptions = options.filter((_, i) => i !== index);
    // 重新计算 order
    const reorderedOptions = newOptions.map((d, i) => ({ ...d, order: i + 1 }));

    try {
      await updateGuildQuickTeamOptions(reorderedOptions);
      setOptions(reorderedOptions);
      mutate();
      showSuccess("删除成功");
    } catch (error) {
      showError(error.response?.data?.detail || "删除失败");
    }
  };

  const handleSave = async () => {
    if (!editForm.name.trim()) {
      showError("选项名称不能为空");
      return;
    }

    let newOptions;
    if (editMode === "add") {
      newOptions = [...options, { ...editForm }];
    } else {
      newOptions = options.map((d, i) => (i === editingIndex ? { ...editForm } : d));
    }

    try {
      await updateGuildQuickTeamOptions(newOptions);
      setOptions(newOptions);
      mutate();
      onClose();
      showSuccess(editMode === "add" ? "添加成功" : "修改成功");
    } catch (error) {
      showError(error.response?.data?.detail || "保存失败");
    }
  };

  const handleReorder = async (newOrder) => {
    // 重新计算 order 字段
    const reorderedOptions = newOrder.map((d, index) => ({
      ...d,
      order: index + 1,
    }));

    setOptions(reorderedOptions);

    try {
      await updateGuildQuickTeamOptions(reorderedOptions);
      mutate();
    } catch (error) {
      showError(error.response?.data?.detail || "排序失败");
      // 恢复原顺序
      setOptions(options);
    }
  };

  if (error) {
    return <div className="p-8 text-center text-red-500">加载失败: {error.message}</div>;
  }

  if (!data) {
    return (
      <div className="p-8 text-center">
        <Spinner />
      </div>
    );
  }

  // 使用本地状态或 API 数据
  const displayOptions = options.length > 0 ? options : data?.options || [];

  return (
    <div>
      <Card>
        <CardHeader className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">快捷开团</h1>
            <p className="text-sm text-gray-500 mt-1">管理开团时的快捷时间选项，支持拖拽排序</p>
          </div>
          <Button color="primary" onPress={handleAdd}>
            新增选项
          </Button>
        </CardHeader>
        <CardBody>
          {displayOptions.length === 0 ? (
            <div className="text-center text-gray-500 py-8">暂无快捷选项配置，点击右上角添加</div>
          ) : (
            <Reorder.Group axis="y" values={displayOptions} onReorder={handleReorder} className="space-y-2">
              {displayOptions.map((option, index) => (
                <Reorder.Item
                  key={`${option.name}-${option.hour}-${option.minute}`}
                  value={option}
                  className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg cursor-move hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-gray-400 font-mono text-sm w-8">{index + 1}</div>
                      <div>
                        <div className="font-medium">{option.name}</div>
                        <div className="text-sm text-gray-500">
                          时间: {formatTime(option.hour, option.minute)}
                          {option.label && <span className="ml-2">| 标签: {option.label}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="flat" onPress={() => handleEdit(index)}>
                        编辑
                      </Button>
                      <Button size="sm" color="danger" variant="flat" onPress={() => handleDelete(index)}>
                        删除
                      </Button>
                    </div>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          )}
        </CardBody>
      </Card>

      {/* 编辑/新增弹窗 */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>{editMode === "add" ? "新增快捷选项" : "编辑快捷选项"}</ModalHeader>
          <ModalBody>
            <Input
              label="选项名称（显示在按钮上）"
              value={editForm.name}
              onValueChange={(value) => setEditForm({ ...editForm, name: value })}
              placeholder="例如: 🚗 第一车 19:50"
              maxLength={20}
            />
            <Input
              label="标题标签（用于自动生成标题）"
              value={editForm.label || ""}
              onValueChange={(value) => setEditForm({ ...editForm, label: value })}
              placeholder="例如: 第一车（留空则使用选项名称）"
              maxLength={10}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                label="小时"
                value={String(editForm.hour)}
                onValueChange={(value) => {
                  const hour = parseInt(value, 10);
                  if (!isNaN(hour) && hour >= 0 && hour <= 23) {
                    setEditForm({ ...editForm, hour });
                  }
                }}
                min={0}
                max={23}
              />
              <Input
                type="number"
                label="分钟"
                value={String(editForm.minute)}
                onValueChange={(value) => {
                  const minute = parseInt(value, 10);
                  if (!isNaN(minute) && minute >= 0 && minute <= 59) {
                    setEditForm({ ...editForm, minute });
                  }
                }}
                min={0}
                max={59}
              />
            </div>
            <div className="text-sm text-gray-500 mt-2 space-y-1">
              <div>按钮预览: {editForm.name || "(未命名)"}</div>
              <div>标题标签: {editForm.label || editForm.name || "(未命名)"}</div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onClose}>
              取消
            </Button>
            <Button color="primary" onPress={handleSave}>
              保存
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
