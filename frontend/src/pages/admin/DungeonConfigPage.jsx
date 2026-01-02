import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { Reorder } from 'framer-motion'
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Spinner,
  Chip,
} from '@heroui/react'
import { getDungeonOptions, updateDungeonOptions } from '../../api/configs'
import { showSuccess, showError, showConfirm } from '../../utils/toast.jsx'

export default function DungeonConfigPage() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [editMode, setEditMode] = useState('add') // 'add' or 'edit'
  const [editingIndex, setEditingIndex] = useState(null)
  const [editForm, setEditForm] = useState({
    name: '',
    type: 'primary',
    order: 0,
  })

  // 获取副本配置
  const { data, error, mutate } = useSWR(
    'dungeon-options',
    () => getDungeonOptions(),
    { revalidateOnFocus: false }
  )

  const [dungeons, setDungeons] = useState([])

  // 当数据加载完成时，更新本地状态
  useEffect(() => {
    if (data?.options) {
      setDungeons(data.options)
    }
  }, [data])

  const handleAdd = () => {
    setEditMode('add')
    setEditForm({
      name: '',
      type: 'primary',
      order: (dungeons?.length || 0) + 1,
    })
    onOpen()
  }

  const handleEdit = (index) => {
    setEditMode('edit')
    setEditingIndex(index)
    setEditForm({ ...dungeons[index] })
    onOpen()
  }

  const handleDelete = async (index) => {
    const dungeon = dungeons[index]
    const confirmed = await showConfirm(`确定要删除副本 ${dungeon.name} 吗？`)
    if (!confirmed) return

    const newDungeons = dungeons.filter((_, i) => i !== index)
    // 重新计算 order
    const reorderedDungeons = newDungeons.map((d, i) => ({ ...d, order: i + 1 }))

    try {
      await updateDungeonOptions(reorderedDungeons)
      setDungeons(reorderedDungeons)
      mutate()
      showSuccess('删除成功')
    } catch (error) {
      showError(error.response?.data?.detail || '删除失败')
    }
  }

  const handleSave = async () => {
    if (!editForm.name.trim()) {
      showError('副本名称不能为空')
      return
    }

    let newDungeons
    if (editMode === 'add') {
      newDungeons = [...dungeons, { ...editForm }]
    } else {
      newDungeons = dungeons.map((d, i) =>
        i === editingIndex ? { ...editForm } : d
      )
    }

    try {
      await updateDungeonOptions(newDungeons)
      setDungeons(newDungeons)
      mutate()
      onClose()
      showSuccess(editMode === 'add' ? '添加成功' : '修改成功')
    } catch (error) {
      showError(error.response?.data?.detail || '保存失败')
    }
  }

  const handleReorder = async (newOrder) => {
    // 重新计算 order 字段
    const reorderedDungeons = newOrder.map((d, index) => ({
      ...d,
      order: index + 1,
    }))

    setDungeons(reorderedDungeons)

    try {
      await updateDungeonOptions(reorderedDungeons)
      mutate()
    } catch (error) {
      showError(error.response?.data?.detail || '排序失败')
      // 恢复原顺序
      setDungeons(dungeons)
    }
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        加载失败: {error.message}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-8 text-center">
        <Spinner />
      </div>
    )
  }

  // 使用本地状态或 API 数据
  const displayDungeons = dungeons.length > 0 ? dungeons : (data?.options || [])

  return (
    <div>
      <Card>
        <CardHeader className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">副本配置</h1>
            <p className="text-sm text-gray-500 mt-1">管理副本选项，支持拖拽排序</p>
          </div>
          <Button color="primary" onPress={handleAdd}>
            新增副本
          </Button>
        </CardHeader>
        <CardBody>
          {displayDungeons.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              暂无副本配置，点击右上角添加
            </div>
          ) : (
            <Reorder.Group
              axis="y"
              values={displayDungeons}
              onReorder={handleReorder}
              className="space-y-2"
            >
              {displayDungeons.map((dungeon, index) => (
                <Reorder.Item
                  key={dungeon.name}
                  value={dungeon}
                  className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg cursor-move hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-gray-400 font-mono text-sm w-8">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{dungeon.name}</div>
                        <div className="text-sm text-gray-500">
                          {dungeon.type === 'primary' ? (
                            <Chip size="sm" color="primary" variant="flat">
                              主要副本
                            </Chip>
                          ) : (
                            <Chip size="sm" color="secondary" variant="flat">
                              次要副本
                            </Chip>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="flat"
                        onPress={() => handleEdit(index)}
                      >
                        编辑
                      </Button>
                      <Button
                        size="sm"
                        color="danger"
                        variant="flat"
                        onPress={() => handleDelete(index)}
                      >
                        删除
                      </Button>
                    </div>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          )}
        </CardBody>
      </Card>

      {/* 编辑/新增弹窗 */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>
            {editMode === 'add' ? '新增副本' : '编辑副本'}
          </ModalHeader>
          <ModalBody>
            <Input
              label="副本名称"
              value={editForm.name}
              onValueChange={(value) =>
                setEditForm({ ...editForm, name: value })
              }
              placeholder="请输入副本名称"
            />
            <Select
              label="副本类型"
              selectedKeys={[editForm.type]}
              onSelectionChange={(keys) => {
                const type = Array.from(keys)[0]
                setEditForm({ ...editForm, type })
              }}
            >
              <SelectItem key="primary" value="primary">
                主要副本
              </SelectItem>
              <SelectItem key="secondary" value="secondary">
                次要副本
              </SelectItem>
            </Select>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onClose}>
              取消
            </Button>
            <Button color="primary" onPress={handleSave}>
              保存
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}
