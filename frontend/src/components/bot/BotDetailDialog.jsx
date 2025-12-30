import { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Spinner,
  Divider,
} from '@heroui/react';
import { getBotDetail, revokeGuildAuthorization } from '../../api/bots';
import { showSuccess, showError, showConfirm } from '../../utils/toast.jsx';
import AuthorizeGuildDialog from './AuthorizeGuildDialog';

export default function BotDetailDialog({ isOpen, botId, onClose, onAuthorizationChange }) {
  const [bot, setBot] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthorizeDialogOpen, setIsAuthorizeDialogOpen] = useState(false);

  // 加载Bot详情
  const loadBotDetail = async () => {
    if (!botId) return;

    setIsLoading(true);
    try {
      const response = await getBotDetail(botId);
      setBot(response.data);
    } catch (error) {
      console.error('加载Bot详情失败:', error);
      showError('加载Bot详情失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && botId) {
      loadBotDetail();
    }
  }, [isOpen, botId]);

  // 处理取消授权
  const handleRevokeAuthorization = async (guildId, guildName) => {
    const confirmed = await showConfirm(
      `确定要取消对群组 "${guildName}" 的授权吗？`,
      'Bot将无法访问该群组'
    );
    if (!confirmed) return;

    try {
      await revokeGuildAuthorization(botId, guildId);
      showSuccess('授权已取消');
      loadBotDetail();
      if (onAuthorizationChange) {
        onAuthorizationChange();
      }
    } catch (error) {
      console.error('取消授权失败:', error);
      showError(error || '取消授权失败');
    }
  };

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('zh-CN');
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="3xl">
        <ModalContent>
          <ModalHeader>Bot详情</ModalHeader>
          <ModalBody>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : bot ? (
              <div className="flex flex-col gap-4">
                {/* 基本信息 */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">基本信息</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Bot名称：</span>
                      <span className="font-medium">{bot.bot_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">状态：</span>
                      <Chip
                        color={bot.is_active ? 'success' : 'default'}
                        size="sm"
                        variant="flat"
                      >
                        {bot.is_active ? '已激活' : '已停用'}
                      </Chip>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">描述：</span>
                      <span>{bot.description || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">创建时间：</span>
                      <span>{formatDate(bot.created_at)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">最后使用：</span>
                      <span>{formatDate(bot.last_used_at)}</span>
                    </div>
                  </div>
                </div>

                <Divider />

                {/* 授权群组列表 */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold">
                      授权群组 ({bot.authorized_guilds?.length || 0})
                    </h3>
                    <Button
                      size="sm"
                      color="primary"
                      variant="flat"
                      onPress={() => setIsAuthorizeDialogOpen(true)}
                    >
                      ➕ 添加授权
                    </Button>
                  </div>

                  {bot.authorized_guilds?.length > 0 ? (
                    <Table aria-label="授权群组">
                      <TableHeader>
                        <TableColumn>群组ID</TableColumn>
                        <TableColumn>群组名称</TableColumn>
                        <TableColumn>授权时间</TableColumn>
                        <TableColumn>操作</TableColumn>
                      </TableHeader>
                      <TableBody>
                        {bot.authorized_guilds.map((guild) => (
                          <TableRow key={guild.guild_id}>
                            <TableCell>{guild.guild_id}</TableCell>
                            <TableCell>{guild.guild_name}</TableCell>
                            <TableCell>{formatDate(guild.created_at)}</TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                color="danger"
                                variant="flat"
                                onPress={() =>
                                  handleRevokeAuthorization(guild.guild_id, guild.guild_name)
                                }
                              >
                                删除
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      暂无授权群组
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </ModalBody>
          <ModalFooter>
            <Button onPress={onClose}>关闭</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 授权群组对话框 */}
      <AuthorizeGuildDialog
        isOpen={isAuthorizeDialogOpen}
        botId={botId}
        onClose={() => setIsAuthorizeDialogOpen(false)}
        onSuccess={() => {
          setIsAuthorizeDialogOpen(false);
          loadBotDetail();
          if (onAuthorizationChange) {
            onAuthorizationChange();
          }
        }}
      />
    </>
  );
}
