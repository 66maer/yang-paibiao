import { useSearchParams } from "react-router-dom";
import GameCard from "@/components/common/GameCard";
import { getImagePath } from "./cardUtils";

export default function GameCardSinglePage() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") || "混沌";
  const name = searchParams.get("name") || "";
  const desc = searchParams.get("desc") || "";
  const enhanced = searchParams.get("enhanced") || "";
  const note = searchParams.get("note") || "";
  const imageDir = searchParams.get("image_dir") || type;

  // 天使卡特判
  if (type === "天使") {
    return (
      <div
        className="min-h-screen bg-gray-950 flex items-center justify-center p-8"
        data-screenshot-ready="true"
      >
        <GameCard
          type="天使"
          title={name || "天使赐福"}
          description={desc || "获得金币"}
          note={note}
        />
      </div>
    );
  }

  const image = getImagePath(name, imageDir);

  return (
    <div
      className="min-h-screen bg-gray-950 flex items-center justify-center p-8"
      data-screenshot-ready="true"
    >
      <GameCard
        type={type}
        title={name}
        description={desc}
        enhancedEffect={enhanced}
        note={note}
        image={image}
      />
    </div>
  );
}
