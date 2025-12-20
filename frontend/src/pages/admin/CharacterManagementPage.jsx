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
  Select,
  SelectItem,
  SelectSection,
} from '@heroui/react'
import {
  getAllCharacters,
  createCharacter,
  updateCharacter,
  deleteCharacter,
} from '../../api/characters'
import { xinfaInfoTable, allXinfaList } from '../../config/xinfa'
import { ALL_SERVERS, SERVERS } from '../../config/servers'
import XinfaSelector from '../../components/XinfaSelector'

// 常见心法列表 - 从配置文件中获取所有心法名称
const XINFA_LIST = allXinfaList.map((key) => xinfaInfoTable[key].name)

// 常见服务器列表 - 从配置文件中获取
const SERVER_LIST = ALL_SERVERS

export default function CharacterManagementPage() {
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [filterServer, setFilterServer] = useState('')
  const [filterXinfa, setFilterXinfa] = useState('')
  const pageSize = 20

  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure()
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure()
  
  const [selectedChar, setSelectedChar] = useState(null)
  const [createForm, setCreateForm] = useState({
    name: '',
    server: '',
    xinfa: '',
    remark: '',
  })
  const [editForm, setEditForm] = useState({
    name: '',
    server: '',
    xinfa: '',
    remark: '',
  })

  // 获取角色列表
  const { data, error, mutate } = useSWR(
    ['characters', page, keyword, filterServer, filterXinfa],
    () =>
      getAllCharacters({
        page,
        page_size: pageSize,
        keyword,
        server: filterServer || undefined,
        xinfa: filterXinfa || undefined,
      }),
    { revalidateOnFocus: false }
  )

  const characters = data?.data?.items || []
  const total = data?.data?.total || 0
  const pages = data?.data?.pages || 0

  const handleSearch = () => {
    setKeyword(searchInput)
    setPage(1)
  }

  const handleCreate = async () => {
    if (!createForm.name || !createForm.server || !createForm.xinfa) {
      showError('请填写所有必填项')
      return
    }

    try {
      await createCharacter(createForm)
      mutate()
      onCreateClose()
      setCreateForm({ name: '', server: '', xinfa: '', remark: '' })
      showSuccess('创建成功')
    } catch (error) {
      showError(error.response?.data?.detail || error.response?.data?.message || '创建失败')
    }
  }

  const handleEdit = (char) => {
    setSelectedChar(char)
    setEditForm({
      name: char.name || '',
      server: char.server || '',
      xinfa: char.xinfa || '',
      remark: char.remark || '',
    })
    onEditOpen()
  }

  const handleUpdate = async () => {
    try {
      await updateCharacter(selectedChar.id, editForm)
      mutate()
      onEditClose()
      showSuccess('更新成功')
    } catch (error) {
      showError(error.response?.data?.detail || error.response?.data?.message || '更新失败')
    }
  }

  const handleDelete = async (charId, charName) => {
    const confirmed = await showConfirm(`确定要删除角色 ${charName} 吗？`)
    if (!confirmed) return

    try {
      await deleteCharacter(charId)
      mutate()
      showSuccess('删除成功')
    } catch (error) {
      showError(error.response?.data?.detail || error.response?.data?.message || '删除失败')
    }
  }

  const resetFilters = () => {
    setKeyword('')
    setSearchInput('')
    setFilterServer('')
    setFilterXinfa('')
    setPage(1)
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
            角色管理 ⚔️
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            管理所有游戏角色
          </p>
        </div>
        <Button color="primary" size="lg" onClick={onCreateOpen}>
          + 创建角色
        </Button>
      </div>

      {/* 搜索和筛选栏 */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl shadow-lg">
        <CardBody>
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <Input
                placeholder="搜索角色名或心法..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
                variant="bordered"
              />
              <Select
                placeholder="服务器"
                className="w-48"
                selectedKeys={filterServer ? [filterServer] : []}
                onChange={(e) => {
                  setFilterServer(e.target.value)
                  setPage(1)
                }}
                variant="bordered"
              >
                {Object.entries(SERVERS).map(([region, servers]) => (
                  <SelectSection key={region} title={region}>
                    {servers.map((server) => (
                      <SelectItem key={server} value={server}>
                        {server}
                      </SelectItem>
                    ))}
                  </SelectSection>
                ))}
              </Select>
              <XinfaSelector
                placeholder="心法"
                className="w-48"
                value={filterXinfa}
                onChange={(value) => {
                  setFilterXinfa(value)
                  setPage(1)
                }}
                variant="bordered"
              />
              <Button color="primary" onClick={handleSearch} className="px-8">
                搜索
              </Button>
              {(keyword || filterServer || filterXinfa) && (
                <Button color="default" variant="flat" onClick={resetFilters}>
                  清除
                </Button>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 角色列表 */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl shadow-lg">
        <CardHeader className="flex justify-between">
          <div>
            <h2 className="text-xl font-bold">角色列表</h2>
            <p className="text-sm text-gray-500">共 {total} 个角色</p>
          </div>
        </CardHeader>
        <CardBody>
          <Table aria-label="角色列表">
            <TableHeader>
              <TableColumn>ID</TableColumn>
              <TableColumn>角色名</TableColumn>
              <TableColumn>服务器</TableColumn>
              <TableColumn>心法</TableColumn>
              <TableColumn>备注</TableColumn>
              <TableColumn>创建时间</TableColumn>
              <TableColumn>操作</TableColumn>
            </TableHeader>
            <TableBody
              items={characters}
              emptyContent={
                <div className="text-center py-8 text-gray-500">
                  {keyword || filterServer || filterXinfa
                    ? '没有找到匹配的角色'
                    : '暂无角色数据'}
                </div>
              }
            >
              {(char) => (
                <TableRow key={char.id}>
                  <TableCell>{char.id}</TableCell>
                  <TableCell>
                    <div className="font-medium">{char.name}</div>
                  </TableCell>
                  <TableCell>
                    <Chip color="secondary" variant="flat" size="sm">
                      {char.server}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Chip color="primary" variant="flat" size="sm">
                      {char.xinfa}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate text-sm text-gray-600">
                      {char.remark || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(char.created_at).toLocaleDateString('zh-CN')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Tooltip content="编辑">
                        <Button
                          size="sm"
                          color="primary"
                          variant="flat"
                          onClick={() => handleEdit(char)}
                        >
                          编辑
                        </Button>
                      </Tooltip>
                      <Tooltip content="删除" color="danger">
                        <Button
                          size="sm"
                          color="danger"
                          variant="flat"
                          onClick={() => handleDelete(char.id, char.name)}
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

      {/* 创建角色模态框 */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="lg">
        <ModalContent>
          <ModalHeader>
            <h3 className="text-xl font-bold">创建角色</h3>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="角色名"
                placeholder="请输入角色名"
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm({ ...createForm, name: e.target.value })
                }
                isRequired
              />
              <Select
                label="服务器"
                placeholder="请选择服务器"
                selectedKeys={createForm.server ? [createForm.server] : []}
                onChange={(e) =>
                  setCreateForm({ ...createForm, server: e.target.value })
                }
                isRequired
              >
                {Object.entries(SERVERS).map(([region, servers]) => (
                  <SelectSection key={region} title={region}>
                    {servers.map((server) => (
                      <SelectItem key={server} value={server}>
                        {server}
                      </SelectItem>
                    ))}
                  </SelectSection>
                ))}
              </Select>
              <XinfaSelector
                label="心法"
                value={createForm.xinfa}
                onChange={(value) =>
                  setCreateForm({ ...createForm, xinfa: value })
                }
                isRequired
              />
              <Input
                label="备注"
                placeholder="请输入备注（可选）"
                value={createForm.remark}
                onChange={(e) =>
                  setCreateForm({ ...createForm, remark: e.target.value })
                }
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onClick={onCreateClose}>
              取消
            </Button>
            <Button color="primary" onClick={handleCreate}>
              创建
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 编辑角色模态框 */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="lg">
        <ModalContent>
          <ModalHeader>
            <h3 className="text-xl font-bold">编辑角色</h3>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="角色名"
                placeholder="请输入角色名"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
              />
              <Select
                label="服务器"
                placeholder="请选择服务器"
                selectedKeys={editForm.server ? [editForm.server] : []}
                onChange={(e) =>
                  setEditForm({ ...editForm, server: e.target.value })
                }
              >
                {Object.entries(SERVERS).map(([region, servers]) => (
                  <SelectSection key={region} title={region}>
                    {servers.map((server) => (
                      <SelectItem key={server} value={server}>
                        {server}
                      </SelectItem>
                    ))}
                  </SelectSection>
                ))}
              </Select>
              <XinfaSelector
                label="心法"
                value={editForm.xinfa}
                onChange={(value) =>
                  setEditForm({ ...editForm, xinfa: value })
                }
              />
              <Input
                label="备注"
                placeholder="请输入备注"
                value={editForm.remark}
                onChange={(e) =>
                  setEditForm({ ...editForm, remark: e.target.value })
                }
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onClick={onEditClose}>
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
