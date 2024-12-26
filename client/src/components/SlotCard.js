import "./SlotCard.scss";
import {
  allXinfaList,
  dpsXinfaList,
  naiXinfaList,
  neigongXinfaList,
  tXinfaList,
  waigongXinfaList,
  xinfaInfoTable,
} from "@/utils/xinfa";
import { Avatar, Flex, Popover, Space, Tooltip } from "antd";
import { LockOutlined } from "@ant-design/icons";

const rulesContent = (rules) => {
  const { allow_rich = false, allow_xinfa_list = [] } = rules;
  // 不允许任何心法，显示锁定
  if (!allow_rich && allow_xinfa_list.length === 0) {
    return (
      <Avatar size={64} icon={<LockOutlined />} alt="锁定" draggable={false} />
    );
  }
  const contentXinfa = (allow_xinfa_list) => {
    // 允许任意心法时的特殊展示
    if (allow_xinfa_list.length === allXinfaList.length) {
      return (
        <Space>
          <Avatar src="/jx3.png" alt="任意心法" draggable={false} />
          <span>不限定心法</span>
        </Space>
      );
    }
    const xinfaAvatarGroup = (xinfa_list, is_disable = false) => {
      const items = xinfa_list.map((xinfa) => {
        const { icon, name } = xinfaInfoTable[xinfa];
        if (is_disable) {
          return (
            <Tooltip key={xinfa} title={`${name}(禁用)`}>
              <div className="disable-xinfa">
                <Avatar src={`/xinfa/${icon}`} alt={name} draggable={false} />
                <div className="disable-xinfa-overlay">
                  <img
                    src="/ban.png"
                    alt="禁用"
                    style={{ width: "100%", height: "100%" }}
                    draggable={false}
                  />
                </div>
              </div>
            </Tooltip>
          );
        }
        return (
          <Tooltip key={xinfa} title={name}>
            <Avatar src={`/xinfa/${icon}`} alt={name} draggable={false} />
          </Tooltip>
        );
      });
      return (
        <Avatar.Group
          maxCount={6}
          maxStyle={{ color: "#f56a00", backgroundColor: "#fde3cf" }}
        >
          {items}
        </Avatar.Group>
      );
    };

    const commonXinfaGroup = (name, ref_list, url, content) => {
      if (
        allow_xinfa_list.length === ref_list.length &&
        allow_xinfa_list.every((xinfa) =>
          xinfaInfoTable[xinfa].type.includes(name)
        )
      ) {
        return (
          <Popover content={xinfaAvatarGroup(allow_xinfa_list)}>
            <Space>
              <Avatar shape="square" src={url} alt={name} draggable={false} />
              {content}
            </Space>
          </Popover>
        );
      }
      return null;
    };
    var ret = null;
    if (
      (ret = commonXinfaGroup("dps", dpsXinfaList, "/dps.svg", "任意输出心法"))
    ) {
      return ret;
    }
    if (
      (ret = commonXinfaGroup(
        "奶妈",
        naiXinfaList,
        "/奶妈.svg",
        "任意治疗心法"
      ))
    ) {
      return ret;
    }
    if ((ret = commonXinfaGroup("T", tXinfaList, "/T.svg", "任意防御心法"))) {
      return ret;
    }
    if (
      (ret = commonXinfaGroup(
        "内功",
        neigongXinfaList,
        "/内功.svg",
        "任意内功心法"
      ))
    ) {
      return ret;
    }
    if (
      (ret = commonXinfaGroup(
        "外功",
        waigongXinfaList,
        "/外功.svg",
        "任意外功心法"
      ))
    ) {
      return ret;
    }
    if (
      allow_xinfa_list.length >= allXinfaList.length - 6 &&
      allow_xinfa_list.length < allXinfaList.length
    ) {
      const xinfa_complement = allXinfaList.filter(
        (xinfa) => !allow_xinfa_list.includes(xinfa)
      );
      return xinfaAvatarGroup(xinfa_complement, true);
    }
    return xinfaAvatarGroup(allow_xinfa_list);
  };

  const contentRich = () => {
    return (
      <Space>
        <Avatar src="/rich.svg" alt="老板坑" draggable={false} />
        <span>老板坑</span>
      </Space>
    );
  };

  if (allow_rich && allow_xinfa_list.length === 0) {
    return contentRich(); // 只允许老板坑
  }

  if (!allow_rich && allow_xinfa_list.length > 0) {
    return contentXinfa(allow_xinfa_list); // 只允许打工坑
  }

  return (
    <div class="multi-content-container">
      <div class="multi-content-bracket">
        <span>或</span>
      </div>
      <div>
        <div>{contentRich()}</div>
        <div>{contentXinfa(allow_xinfa_list)}</div>
      </div>
    </div>
  );
};

const signupContent = (signup_info) => {
  const {
    submit_name = "???",
    signup_name = "???",
    charcater_name = "???",
    charcater_xinfa = "xiaochen",
    client_type = "旗舰",
    is_rich = false,
    is_proxy = false,
    is_lock = false,
    is_dove = false,
    signup_time = 0,
  } = signup_info;
  const xinfa = xinfaInfoTable[charcater_xinfa];
  const bg_url = is_rich ? "/铜钱.svg" : `/menpai/${xinfa.menpai}.svg`;
  const label = (img, alt, title) => {
    return (
      <Tooltip title={title}>
        <img src={img} alt={alt} draggable={false} />
      </Tooltip>
    );
  };
  return (
    <div
      className="slot-card-canvas slot-signup"
      style={{ backgroundColor: xinfa.color }}
    >
      <div
        className="slot-signup-bg-overlay"
        style={{ backgroundImage: `url(${bg_url})` }}
      />
      <div className="slot-signup-content">
        <div className="header">
          <Avatar
            src={`/xinfa/${xinfa.icon}`}
            alt={xinfa.name}
            draggable={false}
          />
          <div className="labels">
            {client_type === "无界" &&
              label("/mobile.svg", "无界", "使用无界端出战")}
            {is_lock && label("/lock.svg", "锁定", "被团长钦定")}
            {is_dove && label("/dove.svg", "鸽子", "放鸽子！可耻！！")}
          </div>
        </div>
        <div className="body">
          <span className="nickname">{signup_name}</span>
          <span className="character-name">{charcater_name}</span>
        </div>
        <div className="footer">
          {is_proxy && <span>{submit_name}(代报)</span>}
        </div>
      </div>
    </div>
  );
};

const SlotCardCanvas = ({ rules = {}, signup_info }) => {
  if (!signup_info || Object.keys(signup_info).length === 0) {
    return (
      <div className="slot-card-canvas slot-rule">{rulesContent(rules)}</div>
    );
  }
  return (
    <Popover content={rulesContent(rules)} trigger="click">
      {signupContent(signup_info)}
    </Popover>
  );
};

const SlotCard = ({ cardInfo }) => {
  return (
    <>
      <SlotCardCanvas rules={{}} signup_info={{}} />
      <SlotCardCanvas
        rules={{
          allow_rich: false,
          allow_xinfa_list: naiXinfaList,
        }}
      />
      <SlotCardCanvas
        rules={{
          allow_rich: false,
          allow_xinfa_list: dpsXinfaList,
        }}
      />
      <SlotCardCanvas
        rules={{
          allow_rich: false,
          allow_xinfa_list: tXinfaList,
        }}
      />
      <SlotCardCanvas
        rules={{
          allow_rich: false,
          allow_xinfa_list: neigongXinfaList,
        }}
      />
      <SlotCardCanvas
        rules={{
          allow_rich: true,
          allow_xinfa_list: waigongXinfaList,
        }}
      />
      <SlotCardCanvas
        rules={{
          allow_rich: true,
          allow_xinfa_list: allXinfaList.filter(
            (xinfa) =>
              xinfa !== "taixuan" &&
              xinfa !== "wufang" &&
              xinfa !== "lingsu" &&
              xinfa !== "gufeng" &&
              xinfa !== "shanhai" &&
              xinfa !== "huajian" &&
              xinfa !== "lijing"
          ),
        }}
      />
      <SlotCardCanvas
        rules={{
          allow_rich: true,
          allow_xinfa_list: allXinfaList.filter(
            (xinfa) =>
              xinfa !== "taixuan" &&
              xinfa !== "wufang" &&
              xinfa !== "lingsu" &&
              xinfa !== "gufeng" &&
              xinfa !== "shanhai" &&
              xinfa !== "huajian" &&
              xinfa !== "lijing"
          ),
        }}
        signup_info={{
          submit_name: "彭于晏",
          signup_name: "青柠",
          charcater_name: "青柠芋圆",
          charcater_xinfa: "lijing",
          client_type: "旗舰",
          is_rich: true,
          is_proxy: false,
          is_lock: false,
          is_dove: false,
          signup_time: 0,
        }}
      />
    </>
  );
};

export default SlotCard;
