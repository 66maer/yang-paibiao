import { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Textarea } from "@heroui/react";
import { showToast } from "@/utils/toast";
import { createGoldRecord, updateGoldRecord } from "@/api/goldRecords";
import { closeTeam } from "@/api/teams";
import GoldAmountInput from "./GoldRecordModal/GoldAmountInput";
import DropSelector from "./GoldRecordModal/DropSelector";
import WorkerSlider from "./GoldRecordModal/WorkerSlider";
import HeibenrenSelector from "./GoldRecordModal/HeibenrenSelector";
import DateTimeInput from "./GoldRecordModal/DateTimeInput";
import DungeonSelector from "./GoldRecordModal/DungeonSelector";
import { goldDropConfig } from "@/features/board/config/goldDropConfig";

/**
 * 金团记录弹窗组件
 *
 * @param {boolean} isOpen - 是否打开
 * @param {function} onClose - 关闭回调
 * @param {object} team - 团队信息（team模式）
 * @param {object} record - 金团记录（edit模式）
 * @param {'team' | 'create' | 'edit'} mode - 模式
 * @param {number} guildId - 群组ID
 * @param {function} onSuccess - 成功回调
 * @param {string} defaultDungeon - 默认副本（create模式）
 */
export default function GoldRecordModal({
  isOpen,
  onClose,
  team,
  record,
  mode = "team",
  guildId,
  onSuccess,
  defaultDungeon,
}) {
  // 模式判断
  const isTeamMode = mode === "team";
  const isEditMode = mode === "edit";
  // const isCreateMode = mode === "create"; // 暂未使用，预留

  // 状态
  const [currentPage, setCurrentPage] = useState(1);
  const [totalGold, setTotalGold] = useState(0);
  const [subsidyGold, setSubsidyGold] = useState(0);
  const [workerCount, setWorkerCount] = useState(25);
  const [selectedDrops, setSelectedDrops] = useState(new Map());
  const [isWildHeibenren, setIsWildHeibenren] = useState(false);
  const [heibenrenMemberId, setHeibenrenMemberId] = useState(null);
  const [heibenrenPlayerName, setHeibenrenPlayerName] = useState(""); // 玩家昵称
  const [heibenrenCharacterName, setHeibenrenCharacterName] = useState("");
  const [heibenrenCharacterId, setHeibenrenCharacterId] = useState(null);
  const [notes, setNotes] = useState("");
  const [countdown, setCountdown] = useState(5);
  const [countdownStarted, setCountdownStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 新增字段（非team模式）
  const [selectedDungeon, setSelectedDungeon] = useState("");
  const [runDateTime, setRunDateTime] = useState("");

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

  // 打开时初始化表单
  useEffect(() => {
    if (!isOpen) return;

    setCurrentPage(1);
    setCountdown(5);
    setCountdownStarted(false);

    if (isEditMode && record) {
      // 编辑模式：从record初始化
      setTotalGold(record.total_gold || 0);
      setSubsidyGold(record.subsidy_gold || 0);
      setWorkerCount(record.worker_count || 25);
      setSelectedDungeon(record.dungeon || "");

      // 格式化日期时间
      if (record.run_date) {
        const date = new Date(record.run_date);
        const formattedDateTime = date.toISOString().slice(0, 16);
        setRunDateTime(formattedDateTime);
      }

      // 恢复掉落选择
      const dropsMap = new Map();

      // 构建物品名称到位置的映射
      const nameToKeyMap = new Map();
      goldDropConfig.forEach((row, rowIndex) => {
        row.forEach((group, groupIndex) => {
          group.items.forEach((item, itemIndex) => {
            const key = `${rowIndex}_${groupIndex}_${itemIndex}`;
            nameToKeyMap.set(item.name, { key, item });
          });
        });
      });

      // 解析special_drops
      if (record.special_drops && Array.isArray(record.special_drops)) {
        record.special_drops.forEach((drop) => {
          // 解析掉落字符串
          let status = "normal";
          let dropText = drop;
          let xinfa = null;

          // 1. 提取状态前缀
          if (dropText.startsWith("【高价】")) {
            status = "expensive";
            dropText = dropText.slice(4); // 去除"【高价】"
          } else if (dropText.startsWith("【烂了】")) {
            status = "bad";
            dropText = dropText.slice(4); // 去除"【烂了】"
          }

          // 2. 提取心法后缀
          const xinfaMatch = dropText.match(/\((.+?)\)$/);
          if (xinfaMatch) {
            xinfa = xinfaMatch[1];
            dropText = dropText.replace(/\(.+?\)$/, "").trim();
          }

          // 3. 根据物品名称找到对应的key
          const itemInfo = nameToKeyMap.get(dropText);
          if (itemInfo) {
            dropsMap.set(itemInfo.key, {
              name: itemInfo.item.name,
              status: status,
              xinfa: xinfa || undefined,
            });
          } else {
            console.warn(`未找到掉落物品: ${dropText}`);
          }
        });
      }

      // 恢复玄晶
      if (record.has_xuanjing && record.xuanjing_drops) {
        const xuanjingInfo = nameToKeyMap.get("玄晶");
        if (xuanjingInfo) {
          dropsMap.set(xuanjingInfo.key, {
            name: "玄晶",
            status: "normal",
            xuanjing: record.xuanjing_drops,
          });
        }
      }

      setSelectedDrops(dropsMap);

      // 恢复黑本人信息
      setIsWildHeibenren(record.heibenren_user_id === null && record.heibenren_info?.user_name === "野人");
      setHeibenrenMemberId(record.heibenren_user_id);
      setHeibenrenCharacterId(record.heibenren_character_id);
      setHeibenrenPlayerName(record.heibenren_info?.user_name || "");
      setHeibenrenCharacterName(record.heibenren_info?.character_name || "");
      setNotes(record.notes || "");
    } else if (isTeamMode && team) {
      // Team模式：从team初始化
      setSelectedDungeon(team.dungeon || "");
      if (team.team_time) {
        const date = new Date(team.team_time);
        const formattedDateTime = date.toISOString().slice(0, 16);
        setRunDateTime(formattedDateTime);
      }
      // 重置其他字段
      setTotalGold(0);
      setSubsidyGold(0);
      setWorkerCount(25);
      setSelectedDrops(new Map());
      setIsWildHeibenren(false);
      setHeibenrenMemberId(null);
      setHeibenrenPlayerName("");
      setHeibenrenCharacterName("");
      setHeibenrenCharacterId(null);
      setNotes("");
    } else {
      // Create模式：使用默认值
      setTotalGold(0);
      setSubsidyGold(0);
      setWorkerCount(25);
      setSelectedDrops(new Map());
      setIsWildHeibenren(false);
      setHeibenrenMemberId(null);
      setHeibenrenPlayerName("");
      setHeibenrenCharacterName("");
      setHeibenrenCharacterId(null);
      setNotes("");

      // 设置默认副本
      setSelectedDungeon(defaultDungeon || "");

      // 设置当前时间为默认时间
      const now = new Date();
      const formattedDateTime = now.toISOString().slice(0, 16);
      setRunDateTime(formattedDateTime);
    }
  }, [isOpen, isEditMode, isTeamMode, record, team, defaultDungeon]);

  // 组装payload数据
  const buildPayload = () => {
    // 将Map转换为数组，分离玄晶和其他掉落
    const drops = Array.from(selectedDrops.values()).filter((d) => d.status !== "none");

    // 提取玄晶数据
    const xuanjingDrop = drops.find((d) => d.name === "玄晶");
    const xuanjingDrops = xuanjingDrop?.xuanjing || null;
    const hasXuanjing = !!xuanjingDrop;

    // 格式化非玄晶的特殊掉落
    const formattedDrops = drops
      .filter((d) => d.name !== "玄晶")
      .map((d) => {
        let dropStr = d.name;
        // 添加状态前缀
        if (d.status === "expensive") dropStr = "【高价】" + dropStr;
        if (d.status === "bad") dropStr = "【烂了】" + dropStr;
        // 添加心法后缀
        if (d.xinfa) dropStr = `${dropStr}(${d.xinfa})`;
        return dropStr;
      });

    // 确定副本和日期
    let dungeon, runDate;
    if (isTeamMode && team) {
      dungeon = team.dungeon;
      runDate = new Date(team.team_time).toISOString().split("T")[0];
    } else {
      dungeon = selectedDungeon;
      runDate = runDateTime
        ? new Date(runDateTime).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];
    }

    const payload = {
      dungeon,
      run_date: runDate,
      total_gold: totalGold,
      subsidy_gold: subsidyGold,
      worker_count: workerCount,
      special_drops: formattedDrops,
      xuanjing_drops: xuanjingDrops,
      has_xuanjing: hasXuanjing,
      heibenren_user_id: isWildHeibenren ? null : heibenrenMemberId,
      heibenren_character_id: isWildHeibenren ? null : heibenrenCharacterId,
      heibenren_info: isWildHeibenren
        ? {
            user_name: "野人",
          }
        : heibenrenPlayerName || heibenrenCharacterName
        ? {
            ...(heibenrenPlayerName && { user_name: heibenrenPlayerName }),
            ...(heibenrenCharacterName && { character_name: heibenrenCharacterName }),
          }
        : null,
      notes: notes || null,
    };

    // 只在team模式且有team_id时才添加
    if (isTeamMode && team?.id) {
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

    if (!isTeamMode && !selectedDungeon) {
      showToast.error("请选择副本");
      return;
    }

    if (!isTeamMode && !runDateTime) {
      showToast.error("请选择日期时间");
      return;
    }

    try {
      setIsSubmitting(true);

      // 组装数据
      const payload = buildPayload();

      if (isEditMode) {
        // 编辑模式：更新记录
        await updateGoldRecord(guildId, record.id, payload);
        showToast.success("金团记录已更新");
        onSuccess?.();
      } else if (isTeamMode) {
        // Team模式：创建记录并关闭开团
        await createGoldRecord(guildId, payload);
        await closeTeam(guildId, team.id);
        showToast.success("金团记录已保存，开团已关闭");
        onSuccess?.();
      } else {
        // Create模式：仅创建记录
        await createGoldRecord(guildId, payload);
        showToast.success("金团记录已创建");
        onSuccess?.();
      }
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
        footer: "border-t border-pink-200 dark:border-pink-900",
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
              {/* 非team模式需要选择副本和日期 - 放在第一行 */}
              {!isTeamMode && (
                <div className="grid grid-cols-2 gap-4">
                  <DungeonSelector value={selectedDungeon} onChange={setSelectedDungeon} isRequired />
                  <DateTimeInput value={runDateTime} onChange={setRunDateTime} isRequired />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <GoldAmountInput value={totalGold} onChange={setTotalGold} isRequired />
                <GoldAmountInput value={subsidyGold} onChange={setSubsidyGold} label="总补贴" />
              </div>

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
                onPlayerNameChange={setHeibenrenPlayerName}
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
              <Button className="bg-gradient-to-r from-pink-500 to-purple-500 text-white" onPress={handleNextPage}>
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
              {/* 只在team模式显示"不保存直接关闭"按钮 */}
              {isTeamMode && (
                <Button
                  color="warning"
                  onPress={handleDirectClose}
                  isDisabled={countdown > 0 || isSubmitting}
                  isLoading={isSubmitting && countdown === 0}
                >
                  不保存直接关闭 {countdown > 0 && `(${countdown}s)`}
                </Button>
              )}
              <Button
                className="bg-gradient-to-r from-pink-500 to-purple-500 text-white"
                onPress={handleSubmitAndClose}
                isLoading={isSubmitting}
              >
                {isEditMode ? "更新记录" : isTeamMode ? "记录并关闭" : "创建记录"}
              </Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
