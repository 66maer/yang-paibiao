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

const ruleContent = (rule) => {
  const { allowRich = false, allowXinfaList = [] } = rule;
  // 不允许任何心法，显示锁定
  if (!allowRich && allowXinfaList.length === 0) {
    return <Avatar size={64} icon={<LockOutlined />} alt="锁定" draggable={false} />;
  }
  const contentXinfa = (allowXinfaList) => {
    // 允许任意心法时的特殊展示
    if (allowXinfaList.length === allXinfaList.length) {
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
                  <img src="/ban.png" alt="禁用" style={{ width: "100%", height: "100%" }} draggable={false} />
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
        <Avatar.Group maxCount={6} maxStyle={{ color: "#f56a00", backgroundColor: "#fde3cf" }}>
          {items}
        </Avatar.Group>
      );
    };

    const commonXinfaGroup = (name, ref_list, url, content) => {
      if (
        allowXinfaList.length === ref_list.length &&
        allowXinfaList.every((xinfa) => xinfaInfoTable[xinfa].type.includes(name))
      ) {
        return (
          <Popover content={xinfaAvatarGroup(allowXinfaList)}>
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
    if ((ret = commonXinfaGroup("dps", dpsXinfaList, "/dps.svg", "任意输出心法"))) {
      return ret;
    }
    if ((ret = commonXinfaGroup("奶妈", naiXinfaList, "/奶妈.svg", "任意治疗心法"))) {
      return ret;
    }
    if ((ret = commonXinfaGroup("T", tXinfaList, "/T.svg", "任意防御心法"))) {
      return ret;
    }
    if ((ret = commonXinfaGroup("内功", neigongXinfaList, "/内功.svg", "任意内功心法"))) {
      return ret;
    }
    if ((ret = commonXinfaGroup("外功", waigongXinfaList, "/外功.svg", "任意外功心法"))) {
      return ret;
    }
    if (allowXinfaList.length >= allXinfaList.length - 6 && allowXinfaList.length < allXinfaList.length) {
      const xinfa_complement = allXinfaList.filter((xinfa) => !allowXinfaList.includes(xinfa));
      return xinfaAvatarGroup(xinfa_complement, true);
    }
    return xinfaAvatarGroup(allowXinfaList);
  };

  const contentRich = () => {
    return (
      <Space>
        <Avatar src="/rich.svg" alt="老板坑" draggable={false} />
        <span>老板坑</span>
      </Space>
    );
  };

  if (allowRich && allowXinfaList.length === 0) {
    return contentRich(); // 只允许老板坑
  }

  if (!allowRich && allowXinfaList.length > 0) {
    return contentXinfa(allowXinfaList); // 只允许打工坑
  }

  return (
    <div class="multi-content-container">
      <div class="multi-content-bracket">
        <span>或</span>
      </div>
      <div>
        <div>{contentRich()}</div>
        <div>{contentXinfa(allowXinfaList)}</div>
      </div>
    </div>
  );
};

const signupContent = (signup_info) => {
  const {
    submitName = "-???-",
    signupName = "-???-",
    characterName = "-???-",
    characterXinfa = "xiaochen",
    clientType = "旗舰",
    isRich = false,
    isProxy = false,
    isLock = false,
    isDove = false,
  } = signup_info;
  const xinfa = xinfaInfoTable[characterXinfa];
  const bg_url = isRich ? "/铜钱.svg" : `/menpai/${xinfa.menpai}.svg`;
  const label = (img, alt, tooltip) => {
    return (
      <Tooltip title={tooltip}>
        <img src={img} alt={alt} draggable={false} />
      </Tooltip>
    );
  };
  return (
    <div className="slot-card-canvas slot-signup" style={{ backgroundColor: xinfa.color }}>
      <div className="slot-signup-bg-overlay" style={{ backgroundImage: `url(${bg_url})` }} />
      <div className="slot-signup-content">
        <div className="header">
          <Avatar src={`/xinfa/${xinfa.icon}`} alt={xinfa.name} draggable={false} />
          <div className="labels">
            {clientType === "无界" && label("/mobile.svg", "无界", "我将使用无界端形态出战")}
            {isDove && label("/dove.svg", "鸽子", "此人放鸽子！可耻！！")}
            {isRich && label("/rich.svg", "老板", "我是尊贵的老板")}
            {isLock && label("/lock.svg", "锁定", "被团长钦定——团长已经撅腚了，你来打这一车！")}
          </div>
        </div>
        <div className="body">
          <span className="nickname">{signupName}</span>
          <span className="character-name">{characterName}</span>
        </div>
        <div className="footer">{isProxy && <span>{submitName}(代报)</span>}</div>
      </div>
    </div>
  );
};

const SlotCardCanvas = ({ rule, signup_info, rulePopover }) => {
  if (!signup_info || Object.keys(signup_info).length === 0) {
    return <div className="slot-card-canvas slot-rule">{ruleContent(rule)}</div>;
  }
  return rulePopover ? (
    <Popover content={ruleContent(rule)} trigger="click">
      {signupContent(signup_info)}
    </Popover>
  ) : (
    signupContent(signup_info)
  );
};

const SlotCard = ({ rule = {}, signupInfo = {}, rulePopover = true }) => {
  return <SlotCardCanvas rule={rule} signup_info={signupInfo} rulePopover={rulePopover} />;
};

export default SlotCard;
