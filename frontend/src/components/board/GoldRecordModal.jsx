import { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Textarea } from "@heroui/react";
import { showToast } from "../../utils/toast";
import { createGoldRecord } from "../../api/goldRecords";
import { closeTeam } from "../../api/teams";
import GoldAmountInput from "./GoldRecordModal/GoldAmountInput";
import DropSelector from "./GoldRecordModal/DropSelector";
import WorkerSlider from "./GoldRecordModal/WorkerSlider";
import HeibenrenSelector from "./GoldRecordModal/HeibenrenSelector";

/**
 * 金团记录弹窗组件
 *
 * @param {boolean} isOpen - 是否打开
 * @param {function} onClose - 关闭回调
 * @param {object} team - 团队信息
 * @param {number} guildId - 群组ID
 * @param {function} onSuccess - 成功回调
 */
export default function GoldRecordModal({ isOpen, onClose, team, guildId, onSuccess }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalGold, setTotalGold] = useState(0);
  const [workerCount, setWorkerCount] = useState(25);
  const [selectedDrops, setSelectedDrops] = useState(new Map());
  const [isWildHeibenren, setIsWildHeibenren] = useState(false);
  const [heibenrenMemberId, setHeibenrenMemberId] = useState(null);
  const [heibenrenCharacterName, setHeibenrenCharacterName] = useState("");
  const [heibenrenCharacterId, setHeibenrenCharacterId] = useState(null);
  const [notes, setNotes] = useState("");
  const [countdown, setCountdown] = useState(5);
  const [countdownStarted, setCountdownStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 倒计时逻辑 - 只在进入第二页后才开始
  useEffect(() => {
    if (!isOpen || !countdownStarted) return;

    const timerId = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, [isOpen, countdownStarted]);

  // 打开时重置表单
  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1);
      setTotalGold(0);
      setWorkerCount(25);
      setSelectedDrops(new Map());
      setIsWildHeibenren(false);
      setHeibenrenMemberId(null);
      setHeibenrenCharacterName("");
      setHeibenrenCharacterId(null);
      setNotes("");
      setCountdown(5);
      setCountdownStarted(false);
    }
  }, [isOpen]);

  // 组装payload数据
  const buildPayload = () => {
    // 将Map转换为数组，并格式化special_drops
    const formattedDrops = Array.from(selectedDrops.values())
      .filter((d) => d.status !== "none")
      .map((d) => {
        let dropStr = d.name;
        // 添加状态前缀
        if (d.status === "expensive") dropStr = "【高价】" + dropStr;
        if (d.status === "bad") dropStr = "【烂了】" + dropStr;
        // 添加心法后缀
        if (d.xinfa) dropStr = `${dropStr}(${d.xinfa})`;
        return dropStr;
      });

    const payload = {
      dungeon: team.dungeon,
      run_date: new Date(team.team_time).toISOString().split("T")[0],
      total_gold: totalGold,
      worker_count: workerCount,
      special_drops: formattedDrops,
      heibenren_user_id: isWildHeibenren ? null : heibenrenMemberId,
      heibenren_character_id: isWildHeibenren ? null : heibenrenCharacterId,
      heibenren_info: isWildHeibenren
        ? {
            user_name: "野人"
          }
        : null,
      notes: notes || null
    };

    // 只在有team_id时才添加
    if (team?.id) {
      payload.team_id = team.id;
    }

    return payload;
  };

  // 切换到下一页
  const handleNextPage = () => {
    setCurrentPage(2);
    // 第一次进入第二页时开始倒计时
    if (!countdownStarted) {
      setCountdownStarted(true);
    }
  };

  // 切换到上一页
  const handlePrevPage = () => {
    setCurrentPage(1);
  };

  // 不保存直接关闭
  const handleDirectClose = async () => {
    try {
      setIsSubmitting(true);
      await closeTeam(guildId, team.id);
      showToast.success("开团已关闭");
      onSuccess?.();
    } catch (error) {
      console.error("关闭开团失败:", error);
      showToast.error(error?.response?.data?.message || "关闭失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 记录并关闭
  const handleSubmitAndClose = async () => {
    // 验证必填字段
    if (totalGold <= 0) {
      showToast.error("请输入有效的金额");
      return;
    }

    if (workerCount < 10 || workerCount > 25) {
      showToast.error("打工人数必须在10-25之间");
      return;
    }

    try {
      setIsSubmitting(true);

      // 组装数据
      const payload = buildPayload();

      // 创建金团记录
      await createGoldRecord(guildId, payload);

      // 关闭开团
      await closeTeam(guildId, team.id);

      showToast.success("金团记录已保存，开团已关闭");
      onSuccess?.();
    } catch (error) {
      console.error("操作失败:", error);
      showToast.error(error?.response?.data?.message || "操作失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
      classNames={{
        base: "bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800",
        header: "border-b border-pink-200 dark:border-pink-900",
        footer: "border-t border-pink-200 dark:border-pink-900"
      }}
    >
      <ModalContent>
        <ModalHeader className="flex-col items-start gap-1">
          <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent text-xl font-bold">
            金团记录
          </span>
          <div className="text-sm font-normal text-gray-600 dark:text-gray-400">
            {team?.title} - {team?.dungeon}
          </div>
        </ModalHeader>

        <ModalBody className="space-y-4 py-6">
          {currentPage === 1 ? (
            <>
              <GoldAmountInput value={totalGold} onChange={setTotalGold} isRequired />

              <DropSelector selectedDrops={selectedDrops} onChange={setSelectedDrops} />

              <WorkerSlider value={workerCount} onChange={setWorkerCount} />
            </>
          ) : (
            <>
              <HeibenrenSelector
                isWildHeibenren={isWildHeibenren}
                onWildChange={setIsWildHeibenren}
                memberId={heibenrenMemberId}
                onMemberChange={setHeibenrenMemberId}
                characterName={heibenrenCharacterName}
                onCharacterNameChange={setHeibenrenCharacterName}
                onCharacterIdChange={setHeibenrenCharacterId}
                guildId={guildId}
              />

              <Textarea label="备注" placeholder="记录额外信息..." value={notes} onValueChange={setNotes} maxRows={3} />
            </>
          )}
        </ModalBody>

        <ModalFooter>
          {currentPage === 1 ? (
            <>
              <Button variant="light" onPress={onClose} isDisabled={isSubmitting}>
                取消
              </Button>
              <Button
                className="bg-gradient-to-r from-pink-500 to-purple-500 text-white"
                onPress={handleNextPage}
              >
                下一页
              </Button>
            </>
          ) : (
            <>
              <Button variant="light" onPress={onClose} isDisabled={isSubmitting}>
                取消
              </Button>
              <Button variant="light" onPress={handlePrevPage} isDisabled={isSubmitting}>
                上一页
              </Button>
              <Button
                color="warning"
                onPress={handleDirectClose}
                isDisabled={countdown > 0 || isSubmitting}
                isLoading={isSubmitting && countdown === 0}
              >
                不保存直接关闭 {countdown > 0 && `(${countdown}s)`}
              </Button>
              <Button
                className="bg-gradient-to-r from-pink-500 to-purple-500 text-white"
                onPress={handleSubmitAndClose}
                isLoading={isSubmitting}
              >
                记录并关闭
              </Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
