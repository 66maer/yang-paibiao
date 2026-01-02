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
  Input,
  Button,
  Pagination,
  Chip,
  Tooltip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Spinner,
  Avatar,
} from '@heroui/react'
import { getUserList, deleteUser, updateUser, resetUserPassword } from '../../api/users'
import { showSuccess, showError, showConfirm } from '../../utils/toast.jsx'

export default function UserManagementPage() {
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const pageSize = 20

  const { isOpen, onOpen, onClose } = useDisclosure()
  const [selectedUser, setSelectedUser] = useState(null)
  const [editForm, setEditForm] = useState({
    nickname: '',
    other_nicknames: [],
    avatar: '',
  })

  // 获取用户列表
  const { data, error, mutate } = useSWR(
    ['users', page, keyword],
    () => getUserList({ page, page_size: pageSize, keyword }),
    { revalidateOnFocus: false }
  )

  const users = data?.data?.items || []
  const total = data?.data?.total || 0
  const pages = data?.data?.pages || 0

  const handleSearch = () => {
    setKeyword(searchInput)
    setPage(1)
  }

  const handleDelete = async (userId, nickname) => {
    const confirmed = await showConfirm(`确定要删除用户 ${nickname} 吗？`)
    if (!confirmed) return

    try {
      await deleteUser(userId)
      mutate()
      showSuccess('删除成功')
    } catch (error) {
      showError(error.response?.data?.message || '删除失败')
    }
  }

  const handleResetPassword = async (userId, nickname) => {
    const confirmed = await showConfirm(`确定要重置用户 ${nickname} 的密码为 123456 吗？`)
    if (!confirmed) return

    try {
      await resetUserPassword(userId)
      showSuccess(`用户 ${nickname} 的密码已重置为 123456`)
    } catch (error) {
      showError(error.response?.data?.message || '重置密码失败')
    }
  }

  const handleEdit = (user) => {
    setSelectedUser(user)
    setEditForm({
      nickname: user.nickname || '',
      other_nicknames: user.other_nicknames || [],
      avatar: user.avatar || '',
    })
    onOpen()
  }

  const handleUpdate = async () => {
    try {
      await updateUser(selectedUser.id, editForm)
      mutate()
      onClose()
      showSuccess('更新成功')
    } catch (error) {
      showError(error.response?.data?.message || '更新失败')
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
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          用户管理 👥
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          管理所有注册用户
        </p>
      </div>

      {/* 搜索栏 */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl shadow-lg">
        <CardBody>
          <div className="flex gap-4">
            <Input
              placeholder="搜索 QQ 号或昵称..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
              variant="bordered"
            />
            <Button
              color="primary"
              onClick={handleSearch}
              className="px-8"
            >
              搜索
            </Button>
            {keyword && (
              <Button
                color="default"
                variant="flat"
                onClick={() => {
                  setKeyword('')
                  setSearchInput('')
                  setPage(1)
                }}
              >
                清除
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {/* 用户列表 */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl shadow-lg">
        <CardHeader className="flex justify-between">
          <div>
            <h2 className="text-xl font-bold">用户列表</h2>
            <p className="text-sm text-gray-500">共 {total} 个用户</p>
          </div>
        </CardHeader>
        <CardBody>
          {!data ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <Table aria-label="用户列表">
              <TableHeader>
                <TableColumn>ID</TableColumn>
                <TableColumn>QQ号</TableColumn>
                <TableColumn>昵称</TableColumn>
                <TableColumn>最后登录</TableColumn>
                <TableColumn>注册时间</TableColumn>
                <TableColumn>操作</TableColumn>
              </TableHeader>
              <TableBody
                items={users}
                emptyContent={
                  <div className="text-center py-8 text-gray-500">
                    {keyword ? '没有找到匹配的用户' : '暂无用户数据'}
                  </div>
                }
              >
                {(user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>
                    <Chip color="primary" variant="flat" size="sm">
                      {user.qq_number}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px]">
                      <div className="font-medium">{user.nickname}</div>
                      {user.other_nicknames && user.other_nicknames.length > 0 && (
                        <div className="text-xs text-gray-500 truncate" title={`别名: ${user.other_nicknames.join(', ')}`}>
                          别名: {user.other_nicknames.join(', ')}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.last_login_at
                      ? new Date(user.last_login_at).toLocaleString('zh-CN')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString('zh-CN')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Tooltip content="编辑">
                        <Button
                          size="sm"
                          color="primary"
                          variant="flat"
                          onClick={() => handleEdit(user)}
                        >
                          编辑
                        </Button>
                      </Tooltip>
                      <Tooltip content="重置密码" color="warning">
                        <Button
                          size="sm"
                          color="warning"
                          variant="flat"
                          onClick={() => handleResetPassword(user.id, user.nickname)}
                        >
                          重置密码
                        </Button>
                      </Tooltip>
                      <Tooltip content="删除" color="danger">
                        <Button
                          size="sm"
                          color="danger"
                          variant="flat"
                          onClick={() => handleDelete(user.id, user.nickname)}
                        >
                          删除
                        </Button>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
                )}
              </TableBody>
            </Table>
          )}

          {/* 分页 */}
          {pages > 1 && (
            <div className="flex justify-center mt-4">
              <Pagination
                total={pages}
                page={page}
                onChange={setPage}
                color="primary"
                showControls
              />
            </div>
          )}
        </CardBody>
      </Card>

      {/* 编辑用户模态框 */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <ModalHeader>
            <h3 className="text-xl font-bold">编辑用户</h3>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              {/* 头像展示 */}
              <div className="flex items-center gap-4">
                <Avatar
                  src={editForm.avatar || undefined}
                  showFallback
                  name={editForm.nickname}
                  size="lg"
                  className="w-20 h-20"
                />
                <div className="flex-1">
                  <Input
                    label="头像URL"
                    placeholder="请输入头像URL"
                    value={editForm.avatar}
                    onChange={(e) =>
                      setEditForm({ ...editForm, avatar: e.target.value })
                    }
                    description="输入新的URL将实时更新头像预览"
                  />
                </div>
              </div>

              {/* 主昵称 */}
              <Input
                label="主昵称"
                placeholder="请输入主昵称"
                value={editForm.nickname}
                onChange={(e) =>
                  setEditForm({ ...editForm, nickname: e.target.value })
                }
                isRequired
              />

              {/* 其他昵称列表 */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  其他昵称
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {editForm.other_nicknames && editForm.other_nicknames.length > 0 ? (
                    editForm.other_nicknames.map((nick, index) => (
                      <Chip
                        key={index}
                        onClose={() => {
                          const newNicknames = editForm.other_nicknames.filter(
                            (_, i) => i !== index
                          )
                          setEditForm({ ...editForm, other_nicknames: newNicknames })
                        }}
                        variant="flat"
                        color="primary"
                      >
                        {nick}
                      </Chip>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">暂无其他昵称</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="输入新昵称后按回车添加"
                    size="sm"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        const newNickname = e.target.value.trim()
                        if (!editForm.other_nicknames.includes(newNickname)) {
                          setEditForm({
                            ...editForm,
                            other_nicknames: [...editForm.other_nicknames, newNickname],
                          })
                        }
                        e.target.value = ''
                      }
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  按回车键添加昵称，点击昵称上的 X 可以删除
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onClick={onClose}>
              取消
            </Button>
            <Button color="primary" onClick={handleUpdate}>
              保存
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}
