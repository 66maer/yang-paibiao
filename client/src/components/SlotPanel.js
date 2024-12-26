import { dpsXinfaList, naiXinfaList } from "../utils/xinfa";
import SlotCard from "./SlotCard";

const SlotXiaoDui = () => {
  return (
    <div className="slot-xiaodui">
      <SlotCard
        cardInfo={{
          rules: {
            allow_rich: false,
            allow_xinfa_list: naiXinfaList,
          },
        }}
      />
      <SlotCard
        cardInfo={{
          rules: {
            allow_rich: false,
            allow_xinfa_list: dpsXinfaList,
          },
        }}
      />
      <SlotCard
        cardInfo={{
          rules: {},
          signupInfo: {
            submit_name: "彭于晏",
            signup_name: "扯秧秧",
            charcater_name: "幸福会长大",
            charcater_xinfa: "lingsu",
            client_type: "旗舰",
            is_rich: false,
            is_proxy: true,
            is_lock: true,
            is_dove: false,
            signup_time: 0,
          },
        }}
      />
      <SlotCard
        cardInfo={{
          rules: {
            allow_rich: true,
            allow_xinfa_list: dpsXinfaList,
          },
          signupInfo: {
            submit_name: "彭于晏",
            signup_name: "丐箩箩",
            charcater_name: "丐箩箩",
            charcater_xinfa: "xiaochen",
            client_type: "旗舰",
            is_rich: false,
            is_proxy: false,
            is_lock: false,
            is_dove: false,
            signup_time: 0,
          },
        }}
      />
      <SlotCard />
    </div>
  );
};

const SlotPanel = ({ slots }) => {
  return (
    <div className="slot-panel" style={{ display: "flex", flexWrap: "wrap" }}>
      <SlotXiaoDui />
      <SlotXiaoDui />
      <SlotXiaoDui />
      <SlotXiaoDui />
      <SlotXiaoDui />
    </div>
  );
};

export default SlotPanel;
