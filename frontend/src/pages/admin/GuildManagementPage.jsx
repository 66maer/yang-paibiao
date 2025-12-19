import { useState } from 'react'
import useSWR from 'swr'
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
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select,
  SelectItem,
  Textarea,
  Pagination,
  Spinner,
} from '@heroui/react'
import { getGuildList, createGuild, updateGuild, getGuildDetail, deleteGuild, transferGuildOwner } from '../../api/guilds'

// 服务器列表
const SERVERS = [
  '剑胆琴心',
  '长安城',
  '电信一区',
  '电信二区',
  '电信三区',
  '电信四区',
  '电信五区',
]

export default function GuildManagementPage() {
  const [page, setPage] = useState(1)
  const [searchQQ, setSearchQQ] = useState('')
  const [searchUkey, setSearchUkey] = useState('')
  const [filterServer, setFilterServer] = useState('')
  const pageSize = 20

  // 模态框状态
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedGuild, setSelectedGuild] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  // 表单数据
  const [formData, setFormData] = useState({
    guild_qq_number: '',
    ukey: '',
    name: '',
    server: '',
    owner_qq_number: '',
    description: '',
    subscription: {
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      features: { max_teams: 100, max_members: 200 },
      notes: '初始订阅',
    },
  })

  // 构建查询参数
  const queryParams = {
    page,
    page_size: pageSize,
    ...(searchQQ && { guild_qq_number: searchQQ }),
    ...(searchUkey && { ukey: searchUkey }),
    ...(filterServer && { server: filterServer }),
  }

  // 获取群组列表
  const { data, error, mutate } = useSWR(
    ['guilds', page, searchQQ, searchUkey, filterServer],
    () => getGuildList(queryParams),
    { revalidateOnFocus: false }
  )

  const guilds = data?.items || []
  const total = data?.total || 0
  const pages = data?.pages || 0

  // 处理创建
  const handleCreate = async () => {
    setIsLoading(true)
    try {
      await createGuild(formData)
      setIsCreateModalOpen(false)
      mutate()
      // 重置表单
      setFormData({
        guild_qq_number: '',
        ukey: '',
        name: '',
        server: '',
        owner_qq_number: '',
        description: '',
        subscription: {
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          features: { max_teams: 100, max_members: 200 },
          notes: '初始订阅',
        },
      })
    } catch (err) {
      alert('创建失败：' + (err.response?.data?.detail || err.message))
    } finally {
      setIsLoading(false)
    }
  }

  // 处理编辑
  const handleEdit = async () => {
    setIsLoading(true)
    try {
      await updateGuild(selectedGuild.id, {
        name: formData.name,
        server: formData.server,
        description: formData.description,
      })
      setIsEditModalOpen(false)
      mutate()
    } catch (err) {
      alert('更新失败：' + (err.response?.data?.detail || err.message))
    } finally {
      setIsLoading(false)
    }
  }

  // 打开编辑模态框
  const openEditModal = (guild) => {
    setSelectedGuild(guild)
    setFormData({
      ...formData,
      name: guild.name,
      server: guild.server,
      description: guild.description || '',
    })
    setIsEditModalOpen(true)
  }

  // 查看详情
  const viewDetail = async (guildId) => {
    try {
      const response = await getGuildDetail(guildId)
      setSelectedGuild(response.data)
      setIsDetailModalOpen(true)
    } catch (err) {
      alert('获取详情失败：' + (err.response?.data?.detail || err.message))
    }
  }

  // 删除群组
  const handleDelete = async (guildId) => {
    if (!confirm('确定要删除此群组吗？')) return
    try {
      await deleteGuild(guildId)
      mutate()
    } catch (err) {
      alert('删除失败：' + (err.response?.data?.detail || err.message))
    }
  }

  if (error) {
    return (
      <div className="p-8">
        <Card className="bg-danger-50 dark:bg-danger-100/10">
          <CardBody>
            <p className="text-danger">加载失败: {error.message}</p>
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* 标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            群组管理 🏰
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            管理所有群组和订阅
          </p>
        </div>
        <Button color="primary" size="lg" onPress={() => setIsCreateModalOpen(true)}>
          + 创建群组
        </Button>
      </div>

      {/* 搜索和筛选 */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl">
        <CardBody>
          <div className="flex gap-4 flex-wrap">
            <Input
              placeholder="搜索群QQ号"
              value={searchQQ}
              onValueChange={setSearchQQ}
              className="max-w-xs"
              isClearable
              onClear={() => setSearchQQ('')}
            />
            <Input
              placeholder="搜索群组标识(ukey)"
              value={searchUkey}
              onValueChange={setSearchUkey}
              className="max-w-xs"
              isClearable
              onClear={() => setSearchUkey('')}
            />
            <Select
              placeholder="筛选服务器"
              value={filterServer}
              onChange={(e) => setFilterServer(e.target.value)}
              className="max-w-xs"
            >
              {SERVERS.map((server) => (
                <SelectItem key={server} value={server}>
                  {server}
                </SelectItem>
              ))}
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* 群组列表 */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl shadow-lg">
        <CardHeader className="flex justify-between">
          <div>
            <h2 className="text-xl font-bold">群组列表</h2>
            <p className="text-sm text-gray-500">共 {total} 个群组</p>
          </div>
        </CardHeader>
        <CardBody>
          {!data ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : total === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-bold mb-2">暂无群组</h3>
              <p className="text-gray-500">点击右上角创建第一个群组</p>
            </div>
          ) : (
            <>
              <Table aria-label="群组列表">
                <TableHeader>
                  <TableColumn>ID</TableColumn>
                  <TableColumn>群号</TableColumn>
                  <TableColumn>UKEY</TableColumn>
                  <TableColumn>群组名称</TableColumn>
                  <TableColumn>服务器</TableColumn>
                  <TableColumn>群主</TableColumn>
                  <TableColumn>订阅状态</TableColumn>
                  <TableColumn>操作</TableColumn>
                </TableHeader>
                <TableBody items={guilds}>
                  {(guild) => (
                    <TableRow key={guild.id}>
                      <TableCell>{guild.id}</TableCell>
                      <TableCell>
                        <Chip color="secondary" variant="flat" size="sm">
                          {guild.guild_qq_number}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          {guild.ukey}
                        </code>
                      </TableCell>
                      <TableCell className="font-medium">{guild.name}</TableCell>
                      <TableCell>{guild.server}</TableCell>
                      <TableCell>
                        {guild.owner ? (
                          <div className="text-sm">
                            <div className="font-medium">{guild.owner.nickname}</div>
                            <div className="text-gray-500">{guild.owner.qq_number}</div>
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {guild.subscription ? (
                          <div className="space-y-1">
                            <Chip
                              color={guild.subscription.is_active ? 'success' : 'danger'}
                              variant="flat"
                              size="sm"
                            >
                              {guild.subscription.is_active ? '有效' : '已过期'}
                            </Chip>
                            {guild.subscription.end_date && (
                              <div className="text-xs text-gray-500">
                                至 {guild.subscription.end_date}
                              </div>
                            )}
                          </div>
                        ) : (
                          <Chip color="default" variant="flat" size="sm">
                            无订阅
                          </Chip>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            color="primary"
                            variant="flat"
                            onPress={() => viewDetail(guild.id)}
                          >
                            详情
                          </Button>
                          <Button
                            size="sm"
                            color="default"
                            variant="flat"
                            onPress={() => openEditModal(guild)}
                          >
                            编辑
                          </Button>
                          <Button
                            size="sm"
                            color="danger"
                            variant="flat"
                            onPress={() => handleDelete(guild.id)}
                          >
                            删除
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
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
                    showControls
                  />
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      {/* 创建群组模态框 */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>创建群组</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="群QQ号"
                placeholder="请输入群QQ号"
                value={formData.guild_qq_number}
                onValueChange={(val) => setFormData({ ...formData, guild_qq_number: val })}
                isRequired
              />
              <Input
                label="群组标识(ukey)"
                placeholder="唯一标识，如: guild001"
                value={formData.ukey}
                onValueChange={(val) => setFormData({ ...formData, ukey: val })}
                isRequired
              />
              <Input
                label="群组名称"
                placeholder="请输入群组名称"
                value={formData.name}
                onValueChange={(val) => setFormData({ ...formData, name: val })}
                isRequired
              />
              <Select
                label="服务器"
                placeholder="选择服务器"
                selectedKeys={formData.server ? [formData.server] : []}
                onSelectionChange={(keys) => setFormData({ ...formData, server: Array.from(keys)[0] })}
                isRequired
              >
                {SERVERS.map((server) => (
                  <SelectItem key={server} value={server}>
                    {server}
                  </SelectItem>
                ))}
              </Select>
              <Input
                label="群主QQ号"
                placeholder="请输入群主的QQ号"
                value={formData.owner_qq_number}
                onValueChange={(val) => setFormData({ ...formData, owner_qq_number: val })}
                isRequired
              />
              <Textarea
                label="群组描述"
                placeholder="选填"
                value={formData.description}
                onValueChange={(val) => setFormData({ ...formData, description: val })}
              />
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">初始订阅设置</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="开始日期"
                    type="date"
                    value={formData.subscription.start_date}
                    onValueChange={(val) =>
                      setFormData({
                        ...formData,
                        subscription: { ...formData.subscription, start_date: val },
                      })
                    }
                  />
                  <Input
                    label="结束日期"
                    type="date"
                    value={formData.subscription.end_date}
                    onValueChange={(val) =>
                      setFormData({
                        ...formData,
                        subscription: { ...formData.subscription, end_date: val },
                      })
                    }
                  />
                </div>
                <Input
                  label="备注"
                  placeholder="订阅备注"
                  className="mt-4"
                  value={formData.subscription.notes}
                  onValueChange={(val) =>
                    setFormData({
                      ...formData,
                      subscription: { ...formData.subscription, notes: val },
                    })
                  }
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setIsCreateModalOpen(false)}>
              取消
            </Button>
            <Button color="primary" onPress={handleCreate} isLoading={isLoading}>
              创建
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 编辑群组模态框 */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <ModalContent>
          <ModalHeader>编辑群组</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="群组名称"
                value={formData.name}
                onValueChange={(val) => setFormData({ ...formData, name: val })}
                isRequired
              />
              <Select
                label="服务器"
                selectedKeys={formData.server ? [formData.server] : []}
                onSelectionChange={(keys) => setFormData({ ...formData, server: Array.from(keys)[0] })}
                isRequired
              >
                {SERVERS.map((server) => (
                  <SelectItem key={server} value={server}>
                    {server}
                  </SelectItem>
                ))}
              </Select>
              <Textarea
                label="群组描述"
                value={formData.description}
                onValueChange={(val) => setFormData({ ...formData, description: val })}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setIsEditModalOpen(false)}>
              取消
            </Button>
            <Button color="primary" onPress={handleEdit} isLoading={isLoading}>
              保存
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 详情模态框 */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        size="3xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>群组详情</ModalHeader>
          <ModalBody>
            {selectedGuild && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">基本信息</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">群QQ号：</span>
                      <span className="font-medium">{selectedGuild.guild_qq_number}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">UKEY：</span>
                      <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {selectedGuild.ukey}
                      </code>
                    </div>
                    <div>
                      <span className="text-gray-500">群组名称：</span>
                      <span className="font-medium">{selectedGuild.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">服务器：</span>
                      <span className="font-medium">{selectedGuild.server}</span>
                    </div>
                  </div>
                  {selectedGuild.description && (
                    <div className="mt-4">
                      <span className="text-gray-500">描述：</span>
                      <p className="mt-1">{selectedGuild.description}</p>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold mb-3">群主信息</h3>
                  {selectedGuild.owner && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">昵称：</span>
                        <span className="font-medium">{selectedGuild.owner.nickname}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">QQ号：</span>
                        <span className="font-medium">{selectedGuild.owner.qq_number}</span>
                      </div>
                    </div>
                  )}
                </div>

                {selectedGuild.current_subscription && (
                  <div>
                    <h3 className="font-semibold mb-3">当前订阅</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">状态：</span>
                        <Chip
                          color={selectedGuild.current_subscription.is_active ? 'success' : 'danger'}
                          size="sm"
                          className="ml-2"
                        >
                          {selectedGuild.current_subscription.is_active ? '有效' : '已过期'}
                        </Chip>
                      </div>
                      <div>
                        <span className="text-gray-500">有效期：</span>
                        <span className="font-medium">
                          {selectedGuild.current_subscription.start_date} ~ {selectedGuild.current_subscription.end_date}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedGuild.subscription_history && selectedGuild.subscription_history.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">订阅历史</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedGuild.subscription_history.map((sub) => (
                        <div key={sub.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                          <div className="flex justify-between">
                            <span>
                              {sub.start_date} ~ {sub.end_date}
                            </span>
                            <Chip color={sub.is_active ? 'success' : 'default'} size="sm" variant="flat">
                              {sub.is_active ? '进行中' : '已结束'}
                            </Chip>
                          </div>
                          {sub.notes && <p className="text-gray-500 mt-1">{sub.notes}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedGuild.stats && (
                  <div>
                    <h3 className="font-semibold mb-3">统计信息</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">成员数：</span>
                        <span className="font-medium">{selectedGuild.stats.member_count || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">团队数：</span>
                        <span className="font-medium">{selectedGuild.stats.team_count || 0}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onPress={() => setIsDetailModalOpen(false)}>关闭</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}
