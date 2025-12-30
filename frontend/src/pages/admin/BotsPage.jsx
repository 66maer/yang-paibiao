import { useState } from 'react';
import useSWR from 'swr';
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
  Input,
  Pagination,
  Spinner,
} from '@heroui/react';
import { getBots, deleteBot, regenerateApiKey } from '../../api/bots';
import { showSuccess, showError, showConfirm } from '../../utils/toast.jsx';
import CreateBotDialog from '../../components/bot/CreateBotDialog';
import EditBotDialog from '../../components/bot/EditBotDialog';
import BotDetailDialog from '../../components/bot/BotDetailDialog';
import ApiKeyDialog from '../../components/bot/ApiKeyDialog';

export default function BotsPage() {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const pageSize = 20;

  // 对话框状态
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
  const [selectedBot, setSelectedBot] = useState(null);
  const [newApiKey, setNewApiKey] = useState('');

  // 构建查询参数
  const queryParams = {
    page,
    page_size: pageSize,
    ...(keyword && { search: keyword }),
  };

  // 获取Bot列表
  const { data, error, mutate } = useSWR(
    ['bots', page, keyword],
    () => getBots(page, pageSize, keyword),
    { revalidateOnFocus: false }
  );

  const bots = data?.data?.items || [];
  const total = data?.data?.total || 0;
  const pages = data?.data?.pages || 0;

  // 处理搜索
  const handleSearch = () => {
    setKeyword(searchInput);
    setPage(1);
  };

  // 处理清空搜索
  const handleClearSearch = () => {
    setSearchInput('');
    setKeyword('');
    setPage(1);
  };

  // 处理删除
  const handleDelete = async (bot) => {
    const confirmed = await showConfirm(
      `确定要删除Bot "${bot.bot_name}" 吗？`,
      '删除后无法恢复'
    );
    if (!confirmed) return;

    try {
      await deleteBot(bot.id);
      showSuccess('Bot删除成功');
      mutate();
    } catch (error) {
      console.error('删除Bot失败:', error);
      showError(error || '删除Bot失败');
    }
  };

  // 处理重新生成API Key
  const handleRegenerateKey = async (bot) => {
    const confirmed = await showConfirm(
      `确定要重新生成Bot "${bot.bot_name}" 的API Key吗？`,
      '旧Key将立即失效！'
    );
    if (!confirmed) return;

    try {
      const response = await regenerateApiKey(bot.id);
      setNewApiKey(response.data.api_key);
      setIsApiKeyDialogOpen(true);
      mutate();
    } catch (error) {
      console.error('重新生成API Key失败:', error);
      showError(error || '重新生成API Key失败');
    }
  };

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('zh-CN');
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex justify-between items-center">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold">机器人管理</h2>
            <p className="text-sm text-gray-500">管理API机器人和授权</p>
          </div>
          <Button
            color="primary"
            onPress={() => setIsCreateDialogOpen(true)}
          >
            ➕ 创建Bot
          </Button>
        </CardHeader>

        <CardBody>
          {/* 搜索框 */}
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="搜索Bot名称"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="max-w-md"
            />
            <Button color="primary" onPress={handleSearch}>
              搜索
            </Button>
            {keyword && (
              <Button variant="flat" onPress={handleClearSearch}>
                清除
              </Button>
            )}
          </div>

          {/* Bot列表 */}
          {error ? (
            <div className="text-center py-8 text-red-500">加载失败</div>
          ) : !data ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <>
              <Table aria-label="Bot列表">
                <TableHeader>
                  <TableColumn>ID</TableColumn>
                  <TableColumn>Bot名称</TableColumn>
                  <TableColumn>描述</TableColumn>
                  <TableColumn>状态</TableColumn>
                  <TableColumn>授权群组</TableColumn>
                  <TableColumn>最后使用</TableColumn>
                  <TableColumn>创建时间</TableColumn>
                  <TableColumn>操作</TableColumn>
                </TableHeader>
                <TableBody>
                  {bots.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">
                        暂无数据
                      </TableCell>
                    </TableRow>
                  ) : (
                    bots.map((bot) => (
                      <TableRow key={bot.id}>
                        <TableCell>{bot.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>🤖</span>
                            <span className="font-medium">{bot.bot_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate text-sm text-gray-600">
                            {bot.description || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Chip
                            color={bot.is_active ? 'success' : 'default'}
                            size="sm"
                            variant="flat"
                          >
                            {bot.is_active ? '已激活' : '已停用'}
                          </Chip>
                        </TableCell>
                        <TableCell>{bot.guild_count || 0}</TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {formatDate(bot.last_used_at)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {formatDate(bot.created_at)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="flat"
                              onPress={() => {
                                setSelectedBot(bot);
                                setIsDetailDialogOpen(true);
                              }}
                            >
                              详情
                            </Button>
                            <Button
                              size="sm"
                              variant="flat"
                              onPress={() => {
                                setSelectedBot(bot);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              编辑
                            </Button>
                            <Button
                              size="sm"
                              variant="flat"
                              color="warning"
                              onPress={() => handleRegenerateKey(bot)}
                            >
                              🔑
                            </Button>
                            <Button
                              size="sm"
                              variant="flat"
                              color="danger"
                              onPress={() => handleDelete(bot)}
                            >
                              删除
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* 分页 */}
              {pages > 1 && (
                <div className="flex justify-center mt-4">
                  <Pagination
                    total={pages}
                    page={page}
                    onChange={setPage}
                    color="primary"
                  />
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      {/* 创建Bot对话框 */}
      <CreateBotDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={() => {
          setIsCreateDialogOpen(false);
          mutate();
        }}
        onApiKeyGenerated={(apiKey) => {
          setNewApiKey(apiKey);
          setIsApiKeyDialogOpen(true);
        }}
      />

      {/* 编辑Bot对话框 */}
      <EditBotDialog
        isOpen={isEditDialogOpen}
        bot={selectedBot}
        onClose={() => {
          setIsEditDialogOpen(false);
          setSelectedBot(null);
        }}
        onSuccess={() => {
          setIsEditDialogOpen(false);
          setSelectedBot(null);
          mutate();
        }}
      />

      {/* Bot详情对话框 */}
      <BotDetailDialog
        isOpen={isDetailDialogOpen}
        botId={selectedBot?.id}
        onClose={() => {
          setIsDetailDialogOpen(false);
          setSelectedBot(null);
        }}
        onAuthorizationChange={() => mutate()}
      />

      {/* API Key显示对话框 */}
      <ApiKeyDialog
        isOpen={isApiKeyDialogOpen}
        apiKey={newApiKey}
        onClose={() => {
          setIsApiKeyDialogOpen(false);
          setNewApiKey('');
        }}
      />
    </div>
  );
}
