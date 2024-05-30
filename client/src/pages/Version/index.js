import { request } from "@/utils";
import { Typography } from "antd";
const { Title, Paragraph, Text } = Typography;

const versionInfo = [
  {
    version: "0.1.2",
    content: [
      "新增模板功能",
      "数据保存使用事务，防止错乱",
      "展示候补列表",
      "添加注册提示",
      "新增首页名称显示",
    ],
  },
  {
    version: "0.1.1",
    content: ["修复团长钦定人后保存无效的bug", "修复更多心法展示的样式错误"],
  },
  {
    version: "0.1.0",
    content: [
      "第一版上线",
      "注册与登录",
      "创建、更新、关闭团队",
      "团队面板，心法选择，指定人，面板展示美化",
      "报名，看板展示",
    ],
  },
];

const planInfo = [
  "开团模板",
  "角色管理",
  "用户信息修改",
  "开团记录",
  "生涯记录",
  "团员管理",
  "团队告示",
];

const Version = () => {
  return (
    <Typography>
      <Title>版本更新</Title>
      {versionInfo.map((item) => (
        <div>
          <Title level={2}>{item.version}</Title>
          <Paragraph>
            <ol>
              {item.content.map((content) => (
                <li>{content}</li>
              ))}
            </ol>
          </Paragraph>
        </div>
      ))}
      <Title>计划更新</Title>
      <Paragraph>
        <ol>
          {planInfo.map((item) => (
            <li>{item}</li>
          ))}
        </ol>
      </Paragraph>
    </Typography>
  );
};

export default Version;
