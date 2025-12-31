import { useState } from "react";
import useSWR from "swr";
import {
  Card,
  CardHeader,
  CardBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select,
  SelectItem,
  Spinner,
  Avatar,
  User,
} from "@heroui/react";
import { getGuildMembers, updateMemberRole } from "@/api/user";
import { showSuccess, showError, showConfirm } from "@/utils/toast.jsx";
import useAuthStore from "@/stores/authStore";

/**
 * 成员管理页面
 */
export default function MembersPage() {
  const { user } = useAuthStore();
  const currentGuildId = user?.current_guild_id;

  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 获取成员列表
  const {
    data: membersData,
    error,
    mutate,
  } = useSWR(
    currentGuildId ? [`members`, currentGuildId] : null,
    () => getGuildMembers(currentGuildId),
    { revalidateOnFocus: false }
  );

  const members = membersData?.data || [];

  // 当前用户在该群组的角色
  const currentUserMember = members.find(
    (m) => m.user_id === user?.id
  );
  const currentUserRole = currentUserMember?.role || "member";

  // 是否有权限修改角色（群主或管理员）
  const canManageRoles = ["owner", "helper"].includes(currentUserRole);

  // 角色中文名称映射
  const roleNames = {
    owner: "群主",
    helper: "管理员",
    member: "普通成员",
  };

  // 角色颜色映射
  const roleColors = {
    owner: "danger",
    helper: "warning",
    member: "default",
  };

  // 打开修改角色弹窗
  const openEditRoleModal = (member) => {
    if (!canManageRoles) {
      showError("权限不足，只有群主和管理员可以修改成员角色");
      return;
    }

    // 不能修改群主的角色
    if (member.role === "owner") {
      showError("不能修改群主的角色");
      return;
    }

    // 管理员不能修改其他管理员的角色
    if (
      currentUserRole === "helper" &&
      member.role === "helper" &&
      member.user_id !== user?.id
    ) {
      showError("管理员不能修改其他管理员的角色");
      return;
    }

    setSelectedMember(member);
    setNewRole(member.role);
    setIsEditRoleModalOpen(true);
  };

  // 处理角色修改
  const handleUpdateRole = async () => {
    if (!selectedMember || !newRole) return;

    const confirmed = await showConfirm(
      `确定要将 ${selectedMember.user.nickname} 的角色修改为 ${roleNames[newRole]} 吗？`
    );
    if (!confirmed) return;

    setIsLoading(true);
    try {
      await updateMemberRole(currentGuildId, selectedMember.user_id, newRole);
      showSuccess("角色修改成功");
      setIsEditRoleModalOpen(false);
      mutate();
    } catch (err) {
      showError("角色修改失败：" + (err.response?.data?.detail || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  // 格式化加入时间
  const formatJoinedAt = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  if (!currentGuildId) {
    return (
      <Card className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30">
        <CardBody className="p-12">
          <div className="text-center space-y-4">
            <div className="text-6xl">⚠️</div>
            <h2 className="text-2xl font-bold text-pink-600 dark:text-pink-400">
              请先选择群组
            </h2>
            <p className="text-default-600">
              您需要先选择一个群组才能查看成员列表
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30">
        <CardBody className="p-12">
          <div className="text-center space-y-4">
            <div className="text-6xl">❌</div>
            <h2 className="text-2xl font-bold text-pink-600 dark:text-pink-400">
              加载失败
            </h2>
            <p className="text-default-600">
              {error.response?.data?.detail || error.message}
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
          👥 成员管理
        </h1>
      </div>

      <Card>
        <CardHeader className="flex gap-3 justify-between">
          <div className="flex flex-col">
            <p className="text-md font-semibold">群组成员</p>
            <p className="text-small text-default-500">
              共 {members.length} 名成员
            </p>
          </div>
        </CardHeader>
        <CardBody>
          {!membersData ? (
            <div className="flex justify-center items-center py-20">
              <Spinner size="lg" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-default-500">暂无成员</p>
            </div>
          ) : (
            <Table aria-label="成员列表">
              <TableHeader>
                <TableColumn>成员</TableColumn>
                <TableColumn>QQ号</TableColumn>
                <TableColumn>群昵称</TableColumn>
                <TableColumn>角色</TableColumn>
                <TableColumn>加入时间</TableColumn>
                {canManageRoles && <TableColumn>操作</TableColumn>}
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <User
                        name={member.user.nickname}
                        description={`ID: ${member.user.id}`}
                        avatarProps={{
                          src: member.user.avatar,
                          name: member.user.nickname,
                        }}
                      />
                    </TableCell>
                    <TableCell>{member.user.qq_number}</TableCell>
                    <TableCell>
                      {member.group_nickname || (
                        <span className="text-default-400">未设置</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip color={roleColors[member.role]} variant="flat">
                        {roleNames[member.role]}
                      </Chip>
                    </TableCell>
                    <TableCell>{formatJoinedAt(member.joined_at)}</TableCell>
                    {canManageRoles && (
                      <TableCell>
                        {member.role !== "owner" && (
                          <Button
                            size="sm"
                            color="primary"
                            variant="flat"
                            onClick={() => openEditRoleModal(member)}
                            isDisabled={
                              currentUserRole === "helper" &&
                              member.role === "helper" &&
                              member.user_id !== user?.id
                            }
                          >
                            修改角色
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* 修改角色弹窗 */}
      <Modal
        isOpen={isEditRoleModalOpen}
        onClose={() => setIsEditRoleModalOpen(false)}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                修改成员角色
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-default-500">成员信息</p>
                    <User
                      name={selectedMember?.user.nickname}
                      description={`QQ: ${selectedMember?.user.qq_number}`}
                      avatarProps={{
                        src: selectedMember?.user.avatar,
                        name: selectedMember?.user.nickname,
                      }}
                    />
                  </div>
                  <div>
                    <p className="text-sm text-default-500 mb-2">当前角色</p>
                    <Chip
                      color={roleColors[selectedMember?.role]}
                      variant="flat"
                    >
                      {roleNames[selectedMember?.role]}
                    </Chip>
                  </div>
                  <Select
                    label="新角色"
                    placeholder="选择新角色"
                    selectedKeys={newRole ? [newRole] : []}
                    onChange={(e) => setNewRole(e.target.value)}
                  >
                    <SelectItem key="helper" value="helper">
                      管理员
                    </SelectItem>
                    <SelectItem key="member" value="member">
                      普通成员
                    </SelectItem>
                  </Select>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="light" onPress={onClose}>
                  取消
                </Button>
                <Button
                  color="primary"
                  onPress={handleUpdateRole}
                  isLoading={isLoading}
                  isDisabled={!newRole || newRole === selectedMember?.role}
                >
                  确认修改
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
