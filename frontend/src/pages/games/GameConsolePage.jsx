import ConsoleHeader from "./components/ConsoleHeader";
import TeamPanel from "./components/TeamPanel";
import CardDrawArea from "./components/CardDrawArea";
import OperationLog from "./components/OperationLog";

export default function GameConsolePage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-4">
      <ConsoleHeader />

      {/* 队伍面板 */}
      <TeamPanel />

      {/* 下半区：抽卡 + 日志 */}
      <div className="flex gap-4 mt-4">
        <div className="flex-1 bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
          <CardDrawArea />
        </div>
        <div className="w-80 bg-white rounded-lg p-3 border border-gray-200 shadow-sm max-h-[500px] flex flex-col">
          <OperationLog />
        </div>
      </div>
    </div>
  );
}
