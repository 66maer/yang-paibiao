import { Tag } from "antd";

const DateTag = ({ date }) => {
  if (!date) {
    return <Tag color="#888">未知</Tag>;
  }
  const today = new Date();
  const target = new Date(date);
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffDay = (target - today) / 1000 / 60 / 60 / 24;
  const weaks = ["日", "一", "二", "三", "四", "五", "六"];
  const weak = weaks[target.getDay()];
  if (diffDay === 0) {
    return <Tag color="#207f4c">周{weak} (今天)</Tag>;
  } else if (diffDay === 1) {
    return <Tag color="#0f95b0">周{weak} (明天)</Tag>;
  } else if (diffDay < 0) {
    return <Tag color="#737c7b">过期</Tag>;
  } else if (diffDay < 5) {
    return <Tag color="#8076a3">周{weak}</Tag>;
  } else if (diffDay >= 5) {
    return <Tag color="#126bae">{diffDay}天后</Tag>;
  }
  return <Tag color="#888">未知</Tag>;
};

export default DateTag;
