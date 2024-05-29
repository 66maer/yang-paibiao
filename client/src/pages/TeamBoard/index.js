import React, { useEffect, useState } from "react";
import { Tabs, Button, Empty, Space, Modal, message, Divider } from "antd";
import { request } from "@/utils";
import { ShowPanel } from "@/components/TeamPanel";
import DateTag from "@/components/DateTag";
import SingUp from "./SignUp";
import dayjs from "dayjs";

const TeamBoard = () => {
  const [activeTeam, setActiveTeam] = useState([]);
  const [signUpOpen, setSignUpOpen] = useState(false);
  const [activeKey, setActiveKey] = useState("");

  useEffect(() => {
    const getActiveTeam = async () => {
      try {
        const res = await request.post("/getActiveTeam");
        setActiveTeam(res);
        if (res.length > 0) setActiveKey(res[0].uuid);
      } catch (err) {
        const { response } = err;
        if (response) {
          message.error(response.data.message);
        } else {
          message.error("网络错误");
        }
      }
    };

    getActiveTeam();
  }, []);

  const onTabChange = (key) => {
    setActiveKey(key);
  };

  if (activeTeam?.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <Empty style={{}} description="最近没开团，别急，尊重夕阳红命运..." />
      </div>
    );
  }

  const onUserCancelSignup = (id) => {
    request
      .post("/cancelSignup", {
        uuid: activeKey,
        recordId: id,
      })
      .then((res) => {
        message.success(res.message);
        setActiveTeam(
          activeTeam.map((team) => {
            if (team.uuid === activeKey) {
              team = res.newTeam;
            }
            return team;
          })
        );
      })
      .catch((err) => {
        const { response } = err;
        if (response) {
          message.error(response.data.message);
        } else {
          message.error("网络错误");
        }
      });
  };

  const showCondidates = (candidates) => {
    if (candidates.length === 0) {
      return <div>无候补人员</div>;
    }

    return candidates.map((candidate) => {
      return (
        <div key={candidate.id}>
          <div>
            <span>{candidate.name}</span>
            <Button
              onClick={() => {
                onUserCancelSignup(candidate.id);
              }}
            >
              取消报名
            </Button>
          </div>
        </div>
      );
    });
  };

  const items = activeTeam.map((team, i) => {
    return {
      key: team.uuid,
      label: (
        <Space>
          <DateTag date={team.team_time} />
          <div
            style={{
              fontSize: "1rem",
              fontWeight: "bold",
              color: "#000",
            }}
          >
            {team.title}
          </div>
        </Space>
      ),
      children: (
        <>
          <div>
            <div style={{ fontSize: "1.5rem" }}>
              {
                // 格式：日期(x月x日) - 标题 - 时间(时:分)
                `${dayjs(team.team_time).format("MM月DD日")} - ${
                  team.title
                } - ${dayjs(team.team_time).format("HH:mm")}`
              }
            </div>
          </div>
          <ShowPanel
            slots={team.slots}
            onUserCancelSignup={onUserCancelSignup}
          />
          <Divider />
          <div>
            <h2>候补人员</h2>
            {showCondidates(team.candidates)}
          </div>
        </>
      ),
    };
  });

  return (
    <>
      <Tabs
        activeKey={activeKey}
        items={items}
        onChange={onTabChange}
        tabBarExtraContent={
          <Space>
            <Button onClick={() => setSignUpOpen(true)}>报名</Button>
          </Space>
        }
      />
      <Modal
        title="报名"
        open={signUpOpen}
        onCancel={() => setSignUpOpen(false)}
        footer={null}
      >
        <SingUp
          activeKey={activeKey}
          setSignUpOpen={setSignUpOpen}
          activeTeam={activeTeam}
          setActiveTeam={setActiveTeam}
        />
      </Modal>
    </>
  );
};

export default TeamBoard;
