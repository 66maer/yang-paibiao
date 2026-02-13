import { useState } from "react";
import { Input, Popover, PopoverTrigger, PopoverContent, Chip, Button, Select, SelectItem } from "@heroui/react";
import { xinfaInfoTable } from "@/config/xinfa";
import useGameConsoleStore from "@/stores/gameConsoleStore";

const xinfaOptions = Object.entries(xinfaInfoTable).map(([key, info]) => ({
  key,
  label: info.name,
  color: info.color,
}));

export default function PlayerCell({ teamIdx, playerIdx }) {
  const player = useGameConsoleStore((s) => s.teams[teamIdx].players[playerIdx]);
  const { updatePlayer, removeCardFromPlayer } = useGameConsoleStore();

  const [dragOver, setDragOver] = useState(false);

  const handleDragStart = (e) => {
    e.dataTransfer.setData("text/plain", JSON.stringify({ teamIdx, playerIdx }));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    try {
      const from = JSON.parse(e.dataTransfer.getData("text/plain"));
      if (from.teamIdx !== teamIdx || from.playerIdx !== playerIdx) {
        useGameConsoleStore.getState().swapPlayers(from.teamIdx, from.playerIdx, teamIdx, playerIdx);
        useGameConsoleStore.getState().addLog(
          "swap",
          `交换: ${from.teamIdx + 1}队${from.playerIdx + 1}号 ↔ ${teamIdx + 1}队${playerIdx + 1}号`
        );
      }
    } catch {}
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`p-2 rounded border transition-colors cursor-grab active:cursor-grabbing ${
        dragOver ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex gap-1 mb-1">
        <Input
          size="sm"
          placeholder="玩家"
          value={player.playerName}
          onValueChange={(v) => updatePlayer(teamIdx, playerIdx, { playerName: v })}
          className="flex-1"
          classNames={{ inputWrapper: "min-h-7 h-7", input: "text-xs" }}
        />
        <Input
          size="sm"
          placeholder="角色"
          value={player.characterName}
          onValueChange={(v) => updatePlayer(teamIdx, playerIdx, { characterName: v })}
          className="flex-1"
          classNames={{ inputWrapper: "min-h-7 h-7", input: "text-xs" }}
        />
      </div>

      <Select
        size="sm"
        placeholder="心法"
        selectedKeys={player.xinfa ? [player.xinfa] : []}
        onSelectionChange={(keys) => {
          const val = [...keys][0] || "";
          updatePlayer(teamIdx, playerIdx, { xinfa: val });
        }}
        className="mb-1"
        classNames={{ trigger: "min-h-7 h-7", value: "text-xs" }}
        aria-label="心法"
      >
        {xinfaOptions.map((opt) => (
          <SelectItem key={opt.key}>{opt.label}</SelectItem>
        ))}
      </Select>

      {/* 个人卡牌 */}
      {player.personalCards.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1">
          {player.personalCards.map((card, ci) => (
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
                    onPress={() => removeCardFromPlayer(teamIdx, playerIdx, ci)}
                  >
                    移除
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          ))}
        </div>
      )}

      <Input
        size="sm"
        placeholder="备注"
        value={player.notes}
        onValueChange={(v) => updatePlayer(teamIdx, playerIdx, { notes: v })}
        classNames={{ inputWrapper: "min-h-6 h-6", input: "text-[10px]" }}
      />
    </div>
  );
}
