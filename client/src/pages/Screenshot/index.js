import React, { useState } from "react";
import { Typography, List, Divider, Tag, Avatar, Space } from "antd";
import SlotPanel from "@/components/SlotPanel";
import { CompassOutlined, ClockCircleOutlined } from "@ant-design/icons";
import SlotAllocate from "@/components/SlotAllocate";
import { xinfaInfoTable } from "@/utils/xinfa";
import "./index.scss"; // 引入样式文件
import DateTag from "@/components/DateTag";

const { Title, Paragraph } = Typography;

const Screenshot = () => {
  const base64Data = localStorage.getItem("screenshotData");

  let decodedData = {};
  try {
    decodedData = JSON.parse(atob(base64Data));
  } catch (error) {
    console.error("Failed to decode Base64 data:", error);
  }

  const {
    title,
    teamTime,
    dungeons,
    notice = "",
    rules = [],
    signups = [],
    bookXuanjing,
    bookYuntie,
    createrNickname,
    createTime,
    updateTime,
    isLock,
  } = decodedData;

  const [slotMemberList, candidates] = SlotAllocate(rules, signups);

  const [expanded, setExpanded] = useState(false);

  return (
    <div className="screenshot-content">
      <div className="screenshot-header">
        {isLock && <Avatar size={32} shape="square" src="/lock.svg" className="lock-icon" />}
        <Title level={2}>{title}</Title>
      </div>
      <Paragraph>
        <pre className="screenshot-pre">
          <Tag icon={<CompassOutlined />} className="team-tag" color="geekblue">
            {dungeons}
          </Tag>
          <Tag icon={<ClockCircleOutlined />} className="team-tag" color="cyan">
            {new Date(teamTime).toLocaleString("zh-CN", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
              second: "numeric",
              timeZone: "Asia/Shanghai",
              //timeZoneName: "short",
            })}
          </Tag>
          <DateTag
            date={new Date(teamTime)}
            style={{
              padding: "4px",
              fontSize: "16px",
            }}
          />
          <Tag className="team-tag" icon={<img src="/玄晶.png" alt="玄晶" />} color={bookXuanjing ? "#f50" : "#5a0"}>
            {bookXuanjing ? "大铁已包" : "大铁可拍"}
          </Tag>
          <Tag className="team-tag" icon={<img src="/陨铁.png" alt="陨铁" />} color={bookYuntie ? "#f50" : "#5a0"}>
            {bookYuntie ? "小铁已包" : "小铁可拍"}
          </Tag>
          <blockquote>
            <Paragraph
              ellipsis={{
                rows: 3,
                expandable: "collapsible",
                expanded,
                onExpand: (_, info) => setExpanded(info.expanded),
              }}
            >
              {notice}
            </Paragraph>
          </blockquote>
          <div className="screenshot-footer">
            <div>
              由 {createrNickname || "未知"} 创建于{" "}
              {new Date(createTime).toLocaleString("zh-CN", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
                second: "numeric",
                timeZone: "Asia/Shanghai",
                //timeZoneName: "short",
              })}
              ， 最后更新时间
              {new Date(updateTime).toLocaleString("zh-CN", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
                second: "numeric",
                timeZone: "Asia/Shanghai",
                //timeZoneName: "short",
              })}
            </div>
          </div>
        </pre>
      </Paragraph>
      <SlotPanel rules={rules} signup_infos={slotMemberList} />
      {candidates.length > 0 && <Divider children="候补列表" />}
      {candidates.length > 0 && (
        <List
          grid={{ gutter: 16, column: 5 }}
          dataSource={candidates}
          renderItem={(item) => {
            const { icon, name, color } = xinfaInfoTable[item.characterXinfa];
            return (
              <List.Item>
                <div className="candidate-item" style={{ backgroundColor: color }}>
                  <div className="candidate-content">
                    <div className="candidate-info">
                      <Avatar src={`/xinfa/${icon}`} alt={name} draggable={false} />
                      <div className="candidate-details">
                        <div className="candidate-name">{item.signupName}</div>
                        <div className="candidate-character">{item.characterName}</div>
                      </div>
                    </div>
                    <div className="candidate-status">
                      <div className="status-replace">{item.isProxy && "代"}</div>
                      <div className="status-lie">{item.isRich && "躺"}</div>
                    </div>
                  </div>
                </div>
              </List.Item>
            );
          }}
        />
      )}
    </div>
  );
};

export default Screenshot;
