import { ShowCard, EditCard } from "@/components/TeamCard";
import { request } from "@/utils";
import { Button, message } from "antd";
const TestPage = () => {
  const leagueJson = {
    leagueGroupNumber: "665209794",
    leagueName: "花眠",
    leagueKey: "zyhm",
    leagueServer: "乾坤一掷",
  };
  //const res = request.post("/createLeague", leagueJson);
  const onClick = async () => {
    try {
      const res = await request.post("/createLeague", leagueJson);
      message.success("创建成功", res);
    } catch (err) {
      if (err.response) {
        message.error(err.response.data.message);
      } else {
        message.error("网络错误");
      }
    }
  };

  return (
    <>
      <div
        style={{
          width: "100%",
          height: "200px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      ></div>
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <EditCard
          rule={{
            available_xinfa: [
              "xiaochen",
              "aoxue",
              "binxin",
              "yunchang",
              "gufeng",
              "mowen",
              "shanhai",
              "xiangzhi",
            ],
            allow_rich: false,
          }}
          member={{
            user: "6666",
            nickname: "丐箩箩",
            xinfa: "xiaochen",
            character_name: "无敌丐帮",
            tags: ["老板", "无界"],
            is_proxy: true,
            is_rich: true,
            is_lock: false,
          }}
        />
      </div>
      <div>
        <Button onClick={onClick}>创建花眠</Button>
      </div>
    </>
  );

  return (
    <div>
      <Button onClick={onClick}>创建花眠</Button>
    </div>
  );
};

export default TestPage;
