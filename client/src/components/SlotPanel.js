import { dpsXinfaList, naiXinfaList } from "../utils/xinfa";
import SlotCard from "./SlotCard";

const SlotXiaoDui = ({ slotD, indexD, mode }) => {
  return (
    <div className="slot-xiaodui">
      {slotD.map((slot, index) => {
        if (mode === "edit") {
          return <SlotCard slot={slot} index={index} />;
        }
        return <SlotCard slot={slot} index={index} />;
      })}
    </div>
  );
};

const SlotPanel = ({ slotsT, mode = "show" }) => {
  slotsT = slotsT || Array(5).fill(Array(5).fill({}));
  return (
    <div className="slot-panel" style={{ display: "flex" }}>
      {slotsT.map((slotD, indexD) => {
        return <SlotXiaoDui slotD={slotD} indexD={indexD} mode={mode} />;
      })}
    </div>
  );
};

export default SlotPanel;
