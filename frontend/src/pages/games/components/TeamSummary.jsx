import { useState } from "react";
import { Input, Button, Chip, Popover, PopoverTrigger, PopoverContent, Textarea } from "@heroui/react";
import useGameConsoleStore from "@/stores/gameConsoleStore";

export default function TeamSummary({ teamIdx }) {
  const team = useGameConsoleStore((s) => s.teams[teamIdx]);
  const { adjustTeamGold, removeCardFromTeam, updateTeamNotes, addLog } = useGameConsoleStore();

  const [goldAmount, setGoldAmount] = useState("");
  const [goldReason, setGoldReason] = useState("");

  const handleGoldAdjust = (sign) => {
    const num = parseInt(goldAmount);
    if (!num || num <= 0) return;
    const delta = sign * num;
    adjustTeamGold(teamIdx, delta);
    addLog("gold", `${teamIdx + 1}队 ${delta > 0 ? "+" : ""}${delta} 金币${goldReason ? `（${goldReason}）` : ""}`);
    setGoldAmount("");
    setGoldReason("");
  };

  return (
    <div className="p-2 rounded border border-gray-300 bg-gray-50">
      {/* 金币 */}
      <div className="flex items-center gap-1 mb-1">
        <span className="text-amber-600 font-bold text-sm">{team.gold}</span>
        <span className="text-[10px] text-gray-400">金币</span>
      </div>

      <div className="flex gap-1 mb-1">
        <Input
          size="sm"
          type="number"
          placeholder="金额"
          value={goldAmount}
          onValueChange={setGoldAmount}
          classNames={{ inputWrapper: "min-h-6 h-6", input: "text-xs" }}
          className="w-16"
        />
        <Input
          size="sm"
          placeholder="原因"
          value={goldReason}
          onValueChange={setGoldReason}
          classNames={{ inputWrapper: "min-h-6 h-6", input: "text-xs" }}
          className="flex-1"
        />
        <Button size="sm" color="success" variant="flat" className="min-w-6 h-6 px-1" onPress={() => handleGoldAdjust(1)}>
          +
        </Button>
        <Button size="sm" color="danger" variant="flat" className="min-w-6 h-6 px-1" onPress={() => handleGoldAdjust(-1)}>
          -
        </Button>
      </div>

      {/* 队伍卡牌 */}
      {team.cards.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1">
          {team.cards.map((card, ci) => (
            <Popover key={ci} placement="top">
              <PopoverTrigger>
                <Chip
                  size="sm"
                  variant="flat"
                  color={card.type === "恶魔" ? "danger" : card.type === "混沌" ? "warning" : card.type === "天使" ? "primary" : "success"}
                  className="cursor-pointer text-[10px]"
                >
                  {card.name}
                </Chip>
              </PopoverTrigger>
              <PopoverContent>
                <div className="p-2 max-w-[200px]">
                  <p className="text-xs font-bold mb-1">{card.name}</p>
                  {card.desc && <p className="text-xs text-gray-500">{card.desc}</p>}
                  <Button
                    size="sm"
                    color="danger"
                    variant="light"
                    className="mt-1"
                    onPress={() => removeCardFromTeam(teamIdx, ci)}
                  >
                    移除
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          ))}
        </div>
      )}

      {/* 队伍备注 */}
      <Textarea
        size="sm"
        placeholder="队伍备注"
        value={team.notes}
        onValueChange={(v) => updateTeamNotes(teamIdx, v)}
        minRows={1}
        maxRows={3}
        classNames={{ input: "text-[10px]" }}
      />
    </div>
  );
}
