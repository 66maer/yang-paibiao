import { useState, useEffect } from 'react'
import useSWR from 'swr'
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
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
} from '@heroui/react'
import {
  getSeasonCorrections,
  createSeasonCorrection,
  updateSeasonCorrection,
  deleteSeasonCorrection,
} from '../../api/seasonCorrection'
import { getDungeonOptions } from '../../api/configs'
import { showSuccess, showError, showConfirm } from '../../utils/toast.jsx'

export default function SeasonCorrectionPage() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [selectedDungeon, setSelectedDungeon] = useState('')
  const [editMode, setEditMode] = useState('add') // 'add' or 'edit'
  const [editingFactor, setEditingFactor] = useState(null)
  const [editForm, setEditForm] = useState({
    start_date: '',
    end_date: '',
    correction_factor: '1.00',
    description: '',
  })

  // 获取副本选项
  const { data: dungeonData } = useSWR('dungeon-options', () =>
    getDungeonOptions()
  )

  // 获取选中副本的修正系数
  const { data: factorsData, error, mutate } = useSWR(
    selectedDungeon ? ['season-corrections', selectedDungeon] : null,
    () => getSeasonCorrections(selectedDungeon),
    { revalidateOnFocus: false }
  )

  const dungeonOptions = dungeonData?.options || []
  const factors = factorsData?.data || []

  const handleAdd = () => {
    if (!selectedDungeon) {
      showError('请先选择副本')
      return
    }
    setEditMode('add')
    setEditingFactor(null)
    setEditForm({
      start_date: '',
      end_date: '',
      correction_factor: '1.00',
      description: '',
    })
    onOpen()
  }

  const handleEdit = (factor) => {
    setEditMode('edit')
    setEditingFactor(factor)
    setEditForm({
      start_date: factor.start_date,
      end_date: factor.end_date || '',
      correction_factor: factor.correction_factor,
      description: factor.description || '',
    })
    onOpen()
  }

  const handleDelete = async (factor) => {
    const confirmed = await showConfirm(
      `确定要删除该赛季修正系数吗？`
    )
    if (!confirmed) return

    try {
      await deleteSeasonCorrection(factor.id)
      mutate()
      showSuccess('删除成功')
    } catch (error) {
      showError(error.response?.data?.detail || '删除失败')
    }
  }

  const handleSave = async () => {
    if (!editForm.start_date || !editForm.correction_factor) {
      showError('请填写必填项')
      return
    }

    const payload = {
      dungeon: selectedDungeon,
      start_date: editForm.start_date,
      end_date: editForm.end_date || null,
      correction_factor: parseFloat(editForm.correction_factor),
      description: editForm.description || null,
    }

    try {
      if (editMode === 'add') {
        await createSeasonCorrection(payload)
        showSuccess('添加成功')
      } else {
        await updateSeasonCorrection(editingFactor.id, payload)
        showSuccess('修改成功')
      }
      mutate()
      onClose()
    } catch (error) {
      showError(error.response?.data?.detail || '保存失败')
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '永久有效'
    return new Date(dateStr).toLocaleDateString('zh-CN')
  }

  return (
    <div>
      <Card>
        <CardHeader className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">赛季修正系数配置</h1>
            <p className="text-sm text-gray-500 mt-1">
              为不同副本在不同时间段配置金额修正系数
            </p>
          </div>
          <Button color="primary" onPress={handleAdd}>
            新增配置
          </Button>
        </CardHeader>
        <CardBody>
          <div className="mb-4">
            <Select
              label="选择副本"
              placeholder="请选择副本"
              selectedKeys={selectedDungeon ? [selectedDungeon] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0]
                setSelectedDungeon(selected || '')
              }}
              className="max-w-xs"
            >
              {dungeonOptions.map((dungeon) => (
                <SelectItem key={dungeon.name} value={dungeon.name}>
                  {dungeon.name}
                </SelectItem>
              ))}
            </Select>
          </div>

          {!selectedDungeon ? (
            <div className="text-center text-gray-500 py-8">
              请先选择副本
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">
              加载失败: {error.message}
            </div>
          ) : !factorsData ? (
            <div className="text-center py-8">
              <Spinner />
            </div>
          ) : factors.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              暂无配置，点击右上角添加
            </div>
          ) : (
            <Table aria-label="赛季修正系数列表">
              <TableHeader>
                <TableColumn>时间段</TableColumn>
                <TableColumn>修正系数</TableColumn>
                <TableColumn>描述</TableColumn>
                <TableColumn>操作</TableColumn>
              </TableHeader>
              <TableBody>
                {factors.map((factor) => (
                  <TableRow key={factor.id}>
                    <TableCell>
                      {formatDate(factor.start_date)} -{' '}
                      {formatDate(factor.end_date)}
                    </TableCell>
                    <TableCell>
                      <Chip color="primary" variant="flat">
                        {factor.correction_factor}
                      </Chip>
                    </TableCell>
                    <TableCell>{factor.description || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="flat"
                          onPress={() => handleEdit(factor)}
                        >
                          编辑
                        </Button>
                        <Button
                          size="sm"
                          color="danger"
                          variant="flat"
                          onPress={() => handleDelete(factor)}
                        >
                          删除
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* 编辑/新增弹窗 */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>
            {editMode === 'add' ? '新增赛季修正系数' : '编辑赛季修正系数'}
          </ModalHeader>
          <ModalBody>
            <Input
              type="date"
              label="开始日期"
              value={editForm.start_date}
              onValueChange={(value) =>
                setEditForm({ ...editForm, start_date: value })
              }
              isRequired
            />
            <Input
              type="date"
              label="结束日期（可选）"
              value={editForm.end_date}
              onValueChange={(value) =>
                setEditForm({ ...editForm, end_date: value })
              }
              description="留空表示永久有效"
            />
            <Input
              type="number"
              label="修正系数"
              value={editForm.correction_factor}
              onValueChange={(value) =>
                setEditForm({ ...editForm, correction_factor: value })
              }
              min="0.01"
              max="999.99"
              step="0.01"
              isRequired
            />
            <Input
              label="描述"
              value={editForm.description}
              onValueChange={(value) =>
                setEditForm({ ...editForm, description: value })
              }
              placeholder="如：第一赛季、版本更新后等"
            />
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
