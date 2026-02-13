import { useState, useMemo } from "react";
import { Button, RadioGroup, Radio, Select, SelectItem, Chip, Input, Textarea } from "@heroui/react";
import GameCard from "@/components/common/GameCard";
import useGameConsoleStore from "@/stores/gameConsoleStore";
import { publishCard } from "@/api/games";
import { getImagePath } from "../cardUtils";
import cardData from "../cardData.json";

const cardTypes = ["恶魔卡", "混沌卡", "绝境卡", "天使卡"];
const typeToDir = { 恶魔卡: "恶魔", 混沌卡: "混沌", 绝境卡: "绝境" };
const typeToDisplay = { 恶魔卡: "恶魔", 混沌卡: "混沌", 绝境卡: "绝境", 天使卡: "天使" };

export default function CardDrawArea() {
  const {
    currentBoss,
    discardPile,
    qqGroupNumber,
    addToDiscardPile,
    assignCardToTeam,
    addLog,
    removeFromDiscardPile,
  } = useGameConsoleStore();

  const [selectedType, setSelectedType] = useState("恶魔卡");
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [targetTeam, setTargetTeam] = useState("1");
  const [publishing, setPublishing] = useState(false);

  // 天使卡状态
  const [angelGold, setAngelGold] = useState("");

  // 可编辑字段
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editEnhanced, setEditEnhanced] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editDetail, setEditDetail] = useState("");

  // 按 boss 过滤并排除已弃的卡
  const availableCards = useMemo(() => {
    if (selectedType === "天使卡") return [];
    const cards = cardData[selectedType] || [];
    const discardedIds = new Set(
      discardPile.filter((c) => c.type === typeToDisplay[selectedType]).map((c) => c.id)
    );
    return cards.filter((c) => c.pool.includes(currentBoss) && !discardedIds.has(c.id));
  }, [selectedType, currentBoss, discardPile]);

  const selectedCard = useMemo(() => {
    if (selectedType === "天使卡" || !selectedCardId) return null;
    return (cardData[selectedType] || []).find((c) => c.id === Number(selectedCardId));
  }, [selectedType, selectedCardId]);

  // 选择卡牌时自动填入
  const handleSelectCard = (keys) => {
    const id = [...keys][0];
    setSelectedCardId(id || null);
    if (id) {
      const card = (cardData[selectedType] || []).find((c) => c.id === Number(id));
      if (card) {
        setEditName(card.name);
        setEditDesc(card.desc);
        setEditEnhanced(card.desc_strengthen || "");
        setEditNote(card.note || "");
        setEditDetail(card.detail || "");
      }
    }
  };

  // 随机抽卡（加权）
  const handleRandom = () => {
    if (selectedType === "天使卡") {
      const gold = Math.floor(Math.random() * 11) + 10; // 10-20
      setAngelGold(String(gold));
      setEditName("天使赐福");
      setEditDesc(`获得 ${gold} 金币`);
      setEditEnhanced("");
      setEditNote("天使的恩赐");
      setEditDetail(`天使赐福：获得 ${gold} 金币`);
      setSelectedCardId(null);
      return;
    }

    if (availableCards.length === 0) return;

    const totalWeight = availableCards.reduce((sum, c) => sum + (c.weight || 1), 0);
    let rand = Math.random() * totalWeight;
    let pick = availableCards[0];
    for (const card of availableCards) {
      rand -= card.weight || 1;
      if (rand <= 0) {
        pick = card;
        break;
      }
    }

    setSelectedCardId(String(pick.id));
    setEditName(pick.name);
    setEditDesc(pick.desc);
    setEditEnhanced(pick.desc_strengthen || "");
    setEditNote(pick.note || "");
    setEditDetail(pick.detail || "");
  };

  // 发布到QQ群
  const handlePublish = async () => {
    try {
      const teamIdx = Number(targetTeam) - 1;
      const displayType = typeToDisplay[selectedType];
      const isAngel = selectedType === "天使卡";

      // 分配卡牌到队伍
      const cardEntry = {
        type: displayType,
        id: isAngel ? null : Number(selectedCardId),
        name: editName,
        desc: editDesc,
      };
      assignCardToTeam(teamIdx, cardEntry);

      // 天使卡加金币且不进弃牌堆
      if (isAngel) {
        const gold = parseInt(angelGold) || 0;
        if (gold > 0) {
          useGameConsoleStore.getState().adjustTeamGold(teamIdx, gold);
          addLog("gold", `${targetTeam}队 天使赐福 +${gold} 金币`);
        }
      } else {
        // 非天使卡进弃牌堆
        addToDiscardPile({ type: displayType, id: Number(selectedCardId), name: editName });
      }

      addLog("card", `${targetTeam}队 抽到 [${displayType}] ${editName}`);

      // 调用后端 API 发布
      if (qqGroupNumber) {
        setPublishing(true);
        try {
          await publishCard({
            qq_group_number: qqGroupNumber,
            card_type: displayType,
            card_name: editName,
            desc: editDesc,
            enhanced: editEnhanced,
            note: editNote,
            detail: editDetail,
            target_team: Number(targetTeam),
            image_dir: typeToDir[selectedType] || displayType,
          });
          addLog("publish", `已发布 [${displayType}] ${editName} 到QQ群`);
        } catch (err) {
          console.error("发布卡牌失败:", err);
          addLog("system", `发布失败: ${err?.message || err}`);
        } finally {
          setPublishing(false);
        }
      } else {
        addLog("system", "未填写QQ群号，仅本地分配卡牌");
      }

      // 重置选择
      setSelectedCardId(null);
      setEditName("");
      setEditDesc("");
      setEditEnhanced("");
      setEditNote("");
      setEditDetail("");
      setAngelGold("");
    } catch (err) {
      console.error("handlePublish 执行错误:", err);
    }
  };

  const canPublish = editName && (selectedType === "天使卡" || selectedCardId);

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-bold text-gray-700">抽卡区</h3>

      {/* 类型选择 */}
      <RadioGroup
        orientation="horizontal"
        value={selectedType}
        onValueChange={(v) => {
          setSelectedType(v);
          setSelectedCardId(null);
          setEditName("");
          setEditDesc("");
          setEditEnhanced("");
          setEditNote("");
          setEditDetail("");
          setAngelGold("");
        }}
        size="sm"
      >
        {cardTypes.map((t) => (
          <Radio key={t} value={t} classNames={{ label: "text-xs" }}>
            {t}
          </Radio>
        ))}
      </RadioGroup>

      {/* 卡牌选择或天使卡设置 */}
      {selectedType === "天使卡" ? (
        <div className="flex gap-2 items-center">
          <Button size="sm" color="primary" variant="flat" onPress={handleRandom}>
            随机金币 (10-20)
          </Button>
          <Input
            size="sm"
            type="number"
            placeholder="金币数"
            value={angelGold}
            onValueChange={(v) => {
              setAngelGold(v);
              setEditName("天使赐福");
              setEditDesc(`获得 ${v} 金币`);
              setEditDetail(`天使赐福：获得 ${v} 金币`);
            }}
            className="w-24"
            classNames={{ inputWrapper: "bg-default-100 min-h-7 h-7", input: "text-xs" }}
          />
        </div>
      ) : (
        <div className="flex gap-2 items-center">
          <Select
            size="sm"
            placeholder={`选择卡牌 (${availableCards.length}张可用)`}
            selectedKeys={selectedCardId ? [selectedCardId] : []}
            onSelectionChange={handleSelectCard}
            className="flex-1"
            classNames={{ trigger: "bg-default-100 min-h-8 h-8", value: "text-xs" }}
            aria-label="选择卡牌"
          >
            {availableCards.map((c) => (
              <SelectItem key={String(c.id)}>{c.name}</SelectItem>
            ))}
          </Select>
          <Button size="sm" color="secondary" variant="flat" onPress={handleRandom} isDisabled={availableCards.length === 0}>
            随机
          </Button>
        </div>
      )}

      {/* 卡牌预览 & 编辑 */}
      {editName && (
        <div className="flex gap-3">
          {/* 预览 - pointer-events-none 避免遮挡下方按钮 */}
          <div className="shrink-0 scale-75 origin-top-left -mr-16 -mb-24 pointer-events-none">
            <GameCard
              type={typeToDisplay[selectedType]}
              title={editName}
              description={editDesc}
              enhancedEffect={editEnhanced}
              note={editNote}
              image={selectedType !== "天使卡" ? getImagePath(editName, typeToDir[selectedType]) : undefined}
            />
          </div>

          {/* 编辑字段 */}
          <div className="flex-1 space-y-1.5 min-w-0">
            <Input
              size="sm"
              label="卡牌名"
              value={editName}
              onValueChange={setEditName}
              classNames={{ inputWrapper: "bg-default-100", input: "text-xs" }}
            />
            <Textarea
              size="sm"
              label="描述"
              value={editDesc}
              onValueChange={setEditDesc}
              minRows={2}
              maxRows={4}
              classNames={{ inputWrapper: "bg-default-100", input: "text-xs" }}
            />
            <Input
              size="sm"
              label="强化效果"
              value={editEnhanced}
              onValueChange={setEditEnhanced}
              classNames={{ inputWrapper: "bg-default-100", input: "text-xs" }}
            />
            <Input
              size="sm"
              label="备注"
              value={editNote}
              onValueChange={setEditNote}
              classNames={{ inputWrapper: "bg-default-100", input: "text-xs" }}
            />
            <Textarea
              size="sm"
              label="详情（发群文字）"
              value={editDetail}
              onValueChange={setEditDetail}
              minRows={2}
              maxRows={4}
              classNames={{ inputWrapper: "bg-default-100", input: "text-xs" }}
            />
          </div>
        </div>
      )}

      {/* 目标队伍 & 发布 */}
      <div className="flex items-center gap-2 relative z-10">
        <span className="text-xs text-gray-500">目标队伍:</span>
        <RadioGroup
          orientation="horizontal"
          value={targetTeam}
          onValueChange={setTargetTeam}
          size="sm"
        >
          {["1", "2", "3", "4", "5"].map((t) => (
            <Radio key={t} value={t} classNames={{ label: "text-xs" }}>
              {t}
            </Radio>
          ))}
        </RadioGroup>
        <Button
          size="sm"
          color="success"
          isDisabled={!canPublish}
          isLoading={publishing}
          onPress={handlePublish}
        >
          {qqGroupNumber ? "发布到QQ群" : "分配卡牌"}
        </Button>
      </div>

      {/* 弃牌堆 */}
      {discardPile.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-1">弃牌堆 ({discardPile.length})</p>
          <div className="flex flex-wrap gap-1">
            {discardPile.map((card, i) => (
              <Chip
                key={i}
                size="sm"
                variant="flat"
                color={card.type === "恶魔" ? "danger" : card.type === "混沌" ? "warning" : "success"}
                className="text-[10px]"
                onClose={() => removeFromDiscardPile(i)}
              >
                {card.name}
              </Chip>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
