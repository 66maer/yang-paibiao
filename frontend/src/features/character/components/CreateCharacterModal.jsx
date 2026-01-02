import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem
} from "@heroui/react";
import ServerSelector from "@/components/common/ServerSelector";
import XinfaSelector from "@/components/common/XinfaSelector";
import { createCharacter } from "@/api/characters";
import { showToast } from "@/utils/toast";

export default function CreateCharacterModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    server: "",
    xinfa: "",
    remark: "",
    relationType: "owner", // 初始关系类型
    priority: 0 // 初始优先级
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // 验证必填字段
    if (!formData.name.trim()) {
      showToast.error("请输入角色名");
      return;
    }
    if (!formData.server) {
      showToast.error("请选择服务器");
      return;
    }
    if (!formData.xinfa) {
      showToast.error("请选择心法");
      return;
    }

    try {
      setLoading(true);

      // 调用 API 创建角色
      await createCharacter({
        name: formData.name.trim(),
        server: formData.server,
        xinfa: formData.xinfa,
        remark: formData.remark.trim() || undefined,
        relation_type: formData.relationType,
        priority: formData.priority
      });

      showToast.success("角色创建成功");

      // 重置表单
      setFormData({
        name: "",
        server: "",
        xinfa: "",
        remark: "",
        relationType: "owner",
        priority: 0
      });

      // 关闭模态框并刷新列表
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      showToast.error(error?.response?.data?.message || "创建失败");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // 重置表单
    setFormData({
      name: "",
      server: "",
      xinfa: "",
      remark: "",
      relationType: "owner",
      priority: 0
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalContent>
        <ModalHeader>创建角色</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {/* 角色名 */}
            <Input
              label="角色名"
              placeholder="请输入角色名"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              isRequired
              variant="flat"
            />

            {/* 服务器 */}
            <ServerSelector
              label="服务器"
              placeholder="请选择服务器"
              value={formData.server}
              onChange={(value) => handleChange("server", value)}
              isRequired
              variant="flat"
            />

            {/* 心法 */}
            <XinfaSelector
              label="心法"
              placeholder="请选择心法"
              value={formData.xinfa}
              onChange={(value) => handleChange("xinfa", value)}
              isRequired
              variant="flat"
            />

            {/* 备注 */}
            <Textarea
              label="备注"
              placeholder="选填：例如装分、主要职责等"
              value={formData.remark}
              onChange={(e) => handleChange("remark", e.target.value)}
              variant="flat"
              minRows={2}
              maxRows={4}
            />

            {/* 优先级 */}
            <Input
              label="优先级"
              type="number"
              placeholder="数值越小优先级越高"
              value={formData.priority.toString()}
              onChange={(e) => handleChange("priority", parseInt(e.target.value) || 0)}
              variant="flat"
              min={0}
              description="用于排序，0为默认优先级"
            />

            {/* 关系类型 */}
            <Select
              label="归属分类"
              placeholder="选择归属分类"
              selectedKeys={[formData.relationType]}
              onSelectionChange={(keys) => handleChange("relationType", Array.from(keys)[0])}
              variant="flat"
            >
              <SelectItem key="owner" value="owner">
                我的角色
              </SelectItem>
              <SelectItem key="shared" value="shared">
                共享角色
              </SelectItem>
            </Select>

            <p className="text-xs text-default-500">
              注：归属分类可以随时调整，用于区分角色的归属类别。
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={handleClose} isDisabled={loading}>
            取消
          </Button>
          <Button color="primary" onPress={handleSubmit} isLoading={loading}>
            创建
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
