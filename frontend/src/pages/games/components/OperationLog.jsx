import { useState } from "react";
import { Input, Button } from "@heroui/react";
import useGameConsoleStore from "@/stores/gameConsoleStore";

export default function OperationLog() {
  const logs = useGameConsoleStore((s) => s.logs);
  const addLog = useGameConsoleStore((s) => s.addLog);
  const [note, setNote] = useState("");

  const handleAddNote = () => {
    if (!note.trim()) return;
    addLog("note", note.trim());
    setNote("");
  };

  const typeColors = {
    card: "text-purple-600",
    gold: "text-amber-600",
    swap: "text-blue-600",
    system: "text-gray-500",
    note: "text-green-600",
    publish: "text-pink-600",
  };

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-sm font-bold text-gray-700 mb-2">操作日志</h3>

      <div className="flex gap-1 mb-2">
        <Input
          size="sm"
          placeholder="输入备注..."
          value={note}
          onValueChange={setNote}
          onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
          classNames={{ inputWrapper: "min-h-7 h-7", input: "text-xs" }}
        />
        <Button size="sm" variant="flat" onPress={handleAddNote} className="min-w-12 h-7">
          添加
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-0.5 min-h-0">
        {logs.map((log) => (
          <div key={log.id} className="text-[11px] leading-tight py-0.5">
            <span className="text-gray-400 mr-1">{log.timestamp}</span>
            <span className={typeColors[log.type] || "text-gray-600"}>{log.message}</span>
          </div>
        ))}
        {logs.length === 0 && <p className="text-xs text-gray-400 text-center mt-4">暂无日志</p>}
      </div>
    </div>
  );
}
