import { useRef } from "react";
import { Input, Button, ButtonGroup, Select, SelectItem } from "@heroui/react";
import { Link } from "react-router-dom";
import useGameConsoleStore from "@/stores/gameConsoleStore";

const bossOptions = [
  { value: 1, label: "1号Boss" },
  { value: 2, label: "2号Boss" },
  { value: 3, label: "3号Boss" },
  { value: 4, label: "4号Boss" },
  { value: 5, label: "5号Boss" },
];

export default function ConsoleHeader() {
  const {
    qqGroupNumber,
    currentBoss,
    setQQGroupNumber,
    setCurrentBoss,
    exportState,
    importState,
    resetAll,
    addLog,
  } = useGameConsoleStore();

  const fileInputRef = useRef(null);

  const handleExport = () => {
    const json = exportState();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `game-console-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addLog("system", "已导出备份");
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const ok = importState(ev.target.result);
      if (ok) {
        addLog("system", "已导入备份");
      } else {
        alert("导入失败，文件格式错误");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleReset = () => {
    if (window.confirm("确定要重置所有数据吗？此操作不可撤销！")) {
      resetAll();
      addLog("system", "已重置所有数据");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm mb-4">
      <Input
        size="sm"
        placeholder="QQ群号"
        value={qqGroupNumber}
        onValueChange={setQQGroupNumber}
        className="w-36"
      />

      <Select
        size="sm"
        selectedKeys={[String(currentBoss)]}
        onSelectionChange={(keys) => {
          const val = Number([...keys][0]);
          if (val) {
            setCurrentBoss(val);
            addLog("system", `切换到 ${val} 号Boss`);
          }
        }}
        className="w-32"
        aria-label="选择Boss"
      >
        {bossOptions.map((opt) => (
          <SelectItem key={String(opt.value)}>{opt.label}</SelectItem>
        ))}
      </Select>

      <div className="flex-1" />

      <ButtonGroup size="sm">
        <Button color="primary" variant="flat" onPress={handleExport}>
          导出
        </Button>
        <Button color="primary" variant="flat" onPress={handleImport}>
          导入
        </Button>
      </ButtonGroup>

      <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />

      <Button size="sm" color="danger" variant="flat" onPress={handleReset}>
        重置
      </Button>

      <Button as={Link} to="/games/2026/card_book" size="sm" variant="flat" target="_blank">
        图鉴
      </Button>
    </div>
  );
}
