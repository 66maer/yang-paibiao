import { useState } from "react";
import { Chip, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import useAuthStore from "../../stores/authStore";
import { xinfaInfoTable } from "../../config/xinfa";

/**
 * 报名信息卡片组件 - 展示本人或代报的报名信息
 * 用于侧边栏展示报名详情
 *
 * Props:
 * @param {Object} signup - 报名信息对象
 *   - characterName: 角色名称（主要展示）
 *   - characterXinfa: 心法数据库字段
 *   - xinfa: 心法名称
 *   - signup_time: 报名时间戳或 ISO 时间字符串
 *   - proxyUserName: 代报名人的昵称（如果有则为代报名）
 * @param {Function} onDelete - 取消报名回调
 * @param {Function} onEdit - 修改报名回调
 */
export default function SignupCard({ signup, onDelete, onEdit }) {
  const { user } = useAuthStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // 获取心法信息
  const xinfa = signup?.characterXinfa
    ? xinfaInfoTable[signup.characterXinfa]
    : signup?.xinfa
    ? Object.values(xinfaInfoTable).find((x) => x.name === signup.xinfa)
    : null;

  const isProxy = !!signup?.isProxy;
  const submitterId = signup?.submitterId;
  const isSelfSubmitter = isProxy && user?.id && submitterId ? submitterId === user.id : false;
  const submitterName = signup?.submitterName || signup?.submitterNickname || signup?.proxyUserName || "他人";

  // 格式化报名时间
  const formatSignupTime = (timeStr) => {
    if (!timeStr) return "时间未知";
    try {
      const date = new Date(timeStr);
      if (isNaN(date.getTime())) return "时间未知";

      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return "刚刚";
      if (diffMins < 60) return `${diffMins}分钟前`;
      if (diffHours < 24) return `${diffHours}小时前`;
      if (diffDays < 7) return `${diffDays}天前`;

      return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
      return "时间未知";
    }
  };

  // 处理取消报名
  const handleConfirmDelete = async () => {
    try {
      setLoading(true);
      await onDelete?.();
      setShowDeleteConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  // 处理修改报名
  const handleConfirmEdit = async () => {
    try {
      setLoading(true);
      await onEdit?.();
      setShowEditModal(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="p-4 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 border-2"
        style={{
          background: xinfa
            ? `linear-gradient(135deg, ${xinfa.color}55, ${xinfa.color}15)`
            : "linear-gradient(135deg, rgba(100,100,100,0.1), rgba(100,100,100,0.05))",
          borderColor: xinfa ? xinfa.color : "rgba(100,100,100,0.3)",
        }}
      >
        <div className="flex items-start gap-4">
          {/* 左侧：心法图标（主要图标，无背景） */}
          <div className="flex-shrink-0">
            {xinfa ? (
              <img src={`/xinfa/${xinfa.icon}`} alt={xinfa.name} className="w-16 h-16 rounded-lg" />
            ) : (
              <div className="w-16 h-16 rounded-lg flex items-center justify-center bg-default-300 text-2xl">❓</div>
            )}
          </div>

          {/* 中间：主要信息 */}
          <div className="flex-1 min-w-0">
            {/* 第一行：角色名 */}
            <div className="mb-1">
              <p className="text-lg font-bold text-default-900 dark:text-default-100 truncate">
                {signup?.characterName || "[未填写角色]"}
              </p>
            </div>

            {/* 第二行：代报名信息（固定高度占位） */}
            <div className="mb-1 h-5">
              {isProxy && (
                <div className="flex items-center gap-2">
                  {isSelfSubmitter ? (
                    <>
                      <Chip size="sm" color="secondary" variant="flat" radius="sm" className="h-5">
                        代
                      </Chip>
                      <p className="text-sm text-default-600 dark:text-default-400 leading-5">
                        {signup?.characterName || "[未填写角色]"} 报名
                      </p>
                    </>
                  ) : (
                    <>
                      <Chip size="sm" color="primary" variant="flat" radius="sm" className="h-5">
                        由
                      </Chip>
                      <p className="text-sm text-default-600 dark:text-default-400 leading-5">{submitterName} 代报</p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* 第三行：报名时间 */}
            <div>
              <p className="text-xs text-default-500">报名时间：{formatSignupTime(signup?.signup_time)}</p>
            </div>
          </div>

          {/* 右侧：控制按钮 */}
          <div className="flex gap-2 flex-shrink-0">
            <Button
              isIconOnly
              size="sm"
              color="warning"
              variant="flat"
              onPress={() => setShowEditModal(true)}
              title="修改报名"
            >
              ✎
            </Button>
            <Button
              isIconOnly
              size="sm"
              color="danger"
              variant="flat"
              onPress={() => setShowDeleteConfirm(true)}
              title="取消报名"
            >
              ✕
            </Button>
          </div>
        </div>
      </div>

      {/* 取消报名确认对话框 */}
      <Modal isOpen={showDeleteConfirm} onOpenChange={setShowDeleteConfirm} backdrop="blur" size="sm">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <span className="text-danger">取消报名</span>
          </ModalHeader>
          <ModalBody>
            <p>你确定要取消报名吗？取消后无法恢复。</p>
            <p className="text-sm text-default-500">
              报名信息：<span className="font-semibold">{signup?.characterName || "[未填写角色]"}</span>
              {isProxy && !isSelfSubmitter && <span> (由 {submitterName} 代报)</span>}
              {isProxy && isSelfSubmitter && <span> (你代报)</span>}
            </p>
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="light" onPress={() => setShowDeleteConfirm(false)} isDisabled={loading}>
              保留报名
            </Button>
            <Button color="danger" onPress={handleConfirmDelete} isLoading={loading}>
              确认取消
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 修改报名弹窗 */}
      <Modal isOpen={showEditModal} onOpenChange={setShowEditModal} backdrop="blur" size="lg">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <span>修改报名</span>
          </ModalHeader>
          <ModalBody>
            {/* TODO: 添加修改报名的表单内容 */}
            <div className="p-8 rounded-lg bg-default-100 dark:bg-default-50 border-2 border-dashed border-default-300 text-center">
              <p className="text-default-400">修改报名表单内容待添加</p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="light" onPress={() => setShowEditModal(false)} isDisabled={loading}>
              取消
            </Button>
            <Button color="primary" onPress={handleConfirmEdit} isLoading={loading}>
              保存修改
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
