import { useState, useEffect, useMemo } from "react";
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import useAuthStore from "../../stores/authStore";
import { getMyCharacters, removeCharacterRelation } from "../../api/characters";
import { showToast } from "../../utils/toast";
import CharacterCard from "../../components/character/CharacterCard";
import CreateCharacterModal from "../../components/character/CreateCharacterModal";
import EditCharacterModal from "../../components/character/EditCharacterModal";

export default function CharactersPage() {
  const { user } = useAuthStore();
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(null);

  // 加载角色列表
  const loadCharacters = async () => {
    try {
      setLoading(true);
      const response = await getMyCharacters({ page: 1, page_size: 100 });
      setCharacters(response.items || []);
    } catch (error) {
      showToast.error(error?.response?.data?.message || "加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCharacters();
  }, []);

  // 根据关系类型分组
  const groupedCharacters = useMemo(() => {
    const owned = [];
    const shared = [];

    characters.forEach((char) => {
      // 查找当前用户在 players 数组中的关系
      const myRelation = char.players?.find((p) => p.user_id === user?.id);

      if (myRelation?.relation_type === "owner") {
        owned.push(char);
      } else if (myRelation?.relation_type === "shared") {
        shared.push(char);
      }
    });

    return { owned, shared };
  }, [characters, user?.id]);

  // 打开创建模态框
  const handleOpenCreate = () => {
    setCreateModalOpen(true);
  };

  // 打开编辑模态框
  const handleOpenEdit = (character) => {
    setSelectedCharacter(character);
    setEditModalOpen(true);
  };

  // 打开删除确认框
  const handleOpenDelete = (character) => {
    setSelectedCharacter(character);
    setDeleteModalOpen(true);
  };

  // 执行删除关联
  const handleConfirmDelete = async () => {
    try {
      await removeCharacterRelation(selectedCharacter.id);
      showToast.success("已删除关联");
      setDeleteModalOpen(false);
      setSelectedCharacter(null);
      loadCharacters(); // 刷新列表
    } catch (error) {
      showToast.error(error?.response?.data?.message || "删除失败");
    }
  };

  // 处理创建/编辑成功
  const handleSuccess = () => {
    loadCharacters();
  };

  // 处理关系类型变更
  const handleRelationChanged = () => {
    loadCharacters();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
          我的角色
        </h2>
        <Button color="primary" onPress={handleOpenCreate}>
          创建角色
        </Button>
      </div>

      {/* 我的角色区块 */}
      <Card className="border bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl">
        <CardHeader>
          <h3 className="text-lg font-bold text-pink-600 dark:text-pink-400">
            我的角色 ({groupedCharacters.owned.length})
          </h3>
        </CardHeader>
        <CardBody>
          {groupedCharacters.owned.length === 0 ? (
            <div className="text-center py-8 text-default-500">
              <p>暂无角色</p>
              <p className="text-sm mt-2">点击右上角"创建角色"按钮添加</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
              {groupedCharacters.owned.map((char) => (
                <CharacterCard
                  key={char.id}
                  character={char}
                  relationType="owner"
                  onEdit={handleOpenEdit}
                  onDelete={handleOpenDelete}
                  onRelationChanged={handleRelationChanged}
                />
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* 共享角色区块（仅在有数据时显示） */}
      {groupedCharacters.shared.length > 0 && (
        <Card className="border bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl">
          <CardHeader>
            <h3 className="text-lg font-bold text-purple-600 dark:text-purple-400">
              共享角色 ({groupedCharacters.shared.length})
            </h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
              {groupedCharacters.shared.map((char) => (
                <CharacterCard
                  key={char.id}
                  character={char}
                  relationType="shared"
                  onEdit={handleOpenEdit}
                  onDelete={handleOpenDelete}
                  onRelationChanged={handleRelationChanged}
                />
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* 创建角色模态框 */}
      <CreateCharacterModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleSuccess}
      />

      {/* 编辑角色模态框 */}
      {selectedCharacter && (
        <EditCharacterModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedCharacter(null);
          }}
          character={selectedCharacter}
          onSuccess={handleSuccess}
        />
      )}

      {/* 删除确认对话框 */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedCharacter(null);
        }}
      >
        <ModalContent>
          <ModalHeader>确认删除关联</ModalHeader>
          <ModalBody>
            <p>
              确定要删除角色 <strong>{selectedCharacter?.name}</strong> 吗？
            </p>
            <p className="text-sm text-default-500 mt-2">
              此操作只会删除你与该角色的关联，角色数据仍会保留，其他用户不受影响。
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => {
                setDeleteModalOpen(false);
                setSelectedCharacter(null);
              }}
            >
              取消
            </Button>
            <Button color="danger" onPress={handleConfirmDelete}>
              确认删除
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
