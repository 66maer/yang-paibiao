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
} from '@heroui/react'
import { getUserList, deleteUser, updateUser } from '../../api/users'

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
    if (!confirm(`确定要删除用户 ${nickname} 吗？`)) return

    try {
      await deleteUser(userId)
      mutate()
      alert('删除成功')
    } catch (error) {
      alert(error.response?.data?.message || '删除失败')
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
      alert('更新成功')
    } catch (error) {
      alert(error.response?.data?.message || '更新失败')
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
                    <div>
                      <div className="font-medium">{user.nickname}</div>
                      {user.other_nicknames && user.other_nicknames.length > 0 && (
                        <div className="text-xs text-gray-500">
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
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalContent>
          <ModalHeader>
            <h3 className="text-xl font-bold">编辑用户</h3>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="昵称"
                placeholder="请输入昵称"
                value={editForm.nickname}
                onChange={(e) =>
                  setEditForm({ ...editForm, nickname: e.target.value })
                }
              />
              <Input
                label="头像URL"
                placeholder="请输入头像URL"
                value={editForm.avatar}
                onChange={(e) =>
                  setEditForm({ ...editForm, avatar: e.target.value })
                }
              />
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
