import TeamColumn from "./TeamColumn";

export default function TeamPanel() {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {[0, 1, 2, 3, 4].map((i) => (
        <TeamColumn key={i} teamIdx={i} />
      ))}
    </div>
  );
}
