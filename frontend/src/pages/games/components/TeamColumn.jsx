import PlayerCell from "./PlayerCell";
import TeamSummary from "./TeamSummary";

export default function TeamColumn({ teamIdx }) {
  return (
    <div className="flex flex-col gap-1.5 min-w-[200px] flex-1">
      <div className="text-center text-sm font-bold text-gray-700 py-1 bg-gray-100 border border-gray-200 rounded">
        {teamIdx + 1} 队
      </div>
      {[0, 1, 2, 3, 4].map((pi) => (
        <PlayerCell key={pi} teamIdx={teamIdx} playerIdx={pi} />
      ))}
      <TeamSummary teamIdx={teamIdx} />
    </div>
  );
}
