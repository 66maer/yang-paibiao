import { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Textarea } from "@heroui/react";
import ServerSelector from "@/components/common/ServerSelector";
import XinfaSelector from "@/components/common/XinfaSelector";
import SecondaryXinfaSelector from "@/components/common/SecondaryXinfaSelector";
import { updateCharacter, updateCharacterRelation } from "@/api/characters";
import { showToast } from "@/utils/toast";
import useAuthStore from "@/stores/authStore";

export default function EditCharacterModal({ isOpen, onClose, character, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const user = useAuthStore((state) => state.user);
  const [formData, setFormData] = useState({
    name: "",
    server: "",
    xinfa: "",
    secondaryXinfas: [],
    remark: "",
    priority: 0,
  });
  const [initialPriority, setInitialPriority] = useState(0);

  // 当角色数据变化时，更新表单
  useEffect(() => {
    if (character && user) {
      // 从 character.players 中找到当前用户的关联记录
      const currentUserPlayer = character.players?.find((p) => p.user_id === user.id);
      const priority = currentUserPlayer?.priority ?? 0;

      setFormData({
        name: character.name || "",
        server: character.server || "",
        xinfa: character.xinfa || "",
        secondaryXinfas: character.secondary_xinfas || [],
        remark: character.remark || "",
        priority: priority,
      });
      setInitialPriority(priority);
    }
  }, [character, user]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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

      // 调用 API 更新角色基本信息
      await updateCharacter(character.id, {
        name: formData.name.trim(),
        server: formData.server,
        xinfa: formData.xinfa,
        secondary_xinfas: formData.secondaryXinfas,
        remark: formData.remark.trim() || undefined,
      });

      // 如果优先级有变化，更新优先级
      if (formData.priority !== initialPriority) {
        await updateCharacterRelation(character.id, {
          priority: formData.priority,
        });
      }

      showToast.success("角色信息已更新");

      // 关闭模态框并刷新列表
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      showToast.error(error?.response?.data?.message || "更新失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalContent>
        <ModalHeader>编辑角色</ModalHeader>
        <ModalBody>
          {/* 警告提示 */}
          <div className="mb-4 p-3 rounded-lg bg-warning/10 border border-warning">
            <div className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-warning flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold text-warning">提示</p>
                <p className="text-xs text-default-600 mt-1">编辑角色信息会同步给所有关联此角色的用户。</p>
              </div>
            </div>
          </div>

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
              label="主心法"
              placeholder="请选择主心法"
              value={formData.xinfa}
              onChange={(value) => {
                handleChange("xinfa", value);
                // 当主心法改变时，从多修心法中移除该心法
                if (formData.secondaryXinfas.includes(value)) {
                  handleChange(
                    "secondaryXinfas",
                    formData.secondaryXinfas.filter((x) => x !== value)
                  );
                }
              }}
              isRequired
              variant="flat"
            />

            {/* 多修心法 */}
            <SecondaryXinfaSelector
              label="多修心法"
              value={formData.secondaryXinfas}
              onChange={(value) => handleChange("secondaryXinfas", value)}
              excludeXinfa={formData.xinfa}
              maxCount={5}
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
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose} isDisabled={loading}>
            取消
          </Button>
          <Button color="primary" onPress={handleSubmit} isLoading={loading}>
            保存
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
