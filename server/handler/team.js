const User = require("../models/user");
const League = require("../models/league");
const Team = require("../models/team");
const TeamMember = require("../models/teamMember");
const { v4: uuidv4 } = require("uuid");
const { xinfaInfoTable } = require("../utils/xinfa.js");

exports.getActiveTeam = async (req, res) => {
  try {
    const teams = await Team.find({
      league: req.curLeagueId,
      active: true,
    }).populate("slots.member");
    res.json(teams);
  } catch (err) {
    res.status(500).json({
      message: "查询活跃团队失败",
    });
  }
};

exports.publishTeam = async (req, res) => {
  try {
    const { title, team_time, note, slots } = req.body;
    slots.map((slot) => {
      if (slot.member) {
        const member = new TeamMember({
          user: slot.member?.user,
          nickname: slot.member.nickname,
          character_name: slot.member?.character_name,
          xinfa: slot.member.xinfa,
          tags: slot.member?.tags,
          is_proxy: slot.member?.is_proxy,
          is_rich: slot.member?.is_rich,
          is_lock: slot.member?.is_lock,
          is_dove: slot.member?.is_dove,
        });
        member.save();
        slot.member = member;
      }
    });

    await Team.create({
      uuid: uuidv4(),
      title,
      team_time,
      league: req.curLeagueId,
      note,
      slots: slots,
    });
    res.json({
      message: "成功发车",
    });
  } catch (err) {
    res.status(500).json({
      message: "发车失败",
    });
  }
};

exports.updateTeam = async (req, res) => {
  try {
    const { uuid, title, team_time, note, slots } = req.body;
    const team = await Team.findOne({ uuid })
      .populate("slots.member")
      .populate("member_record");
    team || res.status(404).json({ message: "未找到团队" });
    team.active || res.status(400).json({ message: "团队已关闭" });
    team.title = title;
    team.team_time = team_time;
    team.note = note;
    // 如果新的slots中有被踢出的人，需要将其取消报名
    for (const oldSlots of team.slots) {
      if (
        oldSlots.member &&
        !slots.find((s) => s.member?.id === oldSlots.member.id)
      ) {
        team.member_record = team.member_record.filter(
          (member) => member.id !== oldSlots.member.id
        );
      }
    }

    team.slots = slots;
    await team.save();

    res.json({
      message: "更新团队成功",
    });
  } catch (err) {
    res.status(500).json({
      message: "更新团队失败",
    });
  }
};

exports.closeTeam = async (req, res) => {
  try {
    const { uuid } = req.body;
    await Team.findOneAndUpdate({ uuid }, { active: false });
    res.json({
      message: "关闭团队成功",
    });
  } catch (err) {
    res.status(500).json({
      message: "关闭团队失败",
    });
  }
};

exports.signup = async (req, res) => {
  try {
    const { uuid, xinfa, character_name, is_rich, is_proxy, tags } = req.body;
    const team = await Team.findOne({ uuid })
      .populate("slots.member")
      .populate("candidates")
      .populate("member_record");
    team || res.status(404).json({ message: "未找到团队" });
    team.active || res.status(400).json({ message: "团队已关闭" });
    if (
      !is_proxy &&
      team.member_record.find(
        (member) =>
          member?.user?.toString() === req.user.id.toString() &&
          !member?.is_proxy
      )
    ) {
      return res.status(400).json({ message: "你已经报过名了" });
    }
    for (const slot of team.slots) {
      if (
        slot.member?.is_lock &&
        slot.member?.user?.toString() === req.user.id.toString()
      ) {
        return res
          .status(400)
          .json({ message: "团长已经撅腚了，钦定你打本，不需要报名" });
      }
    }

    const record = new TeamMember({
      user: req.user.id,
      nickname: req.user.nickname,
      character_name,
      xinfa,
      tags,
      is_proxy,
      is_rich,
    });

    team.member_record.push(record);

    let succSign = false;
    // 先简单插入，遍历所有的slot，找到第一个符合条件的slot，插入
    for (const slot of team.slots) {
      const { rule } = slot;
      if (slot.member?.nickname) {
        continue; // 说明这个位置已经有人了
      }
      if (
        (is_rich && rule.allow_rich) ||
        (!is_rich && rule.available_xinfa.includes(xinfa))
      ) {
        succSign = true;
        slot.member = record;
        break;
      }
    }
    if (!succSign) {
      // 简单插入失败，尝试重排
      const xinfaSlotsMap = {};
      Object.keys(xinfaInfoTable).forEach((xinfa) => {
        xinfaSlotsMap[xinfa] = [];
      });
      let richSlots = [];
      const consumeSlots = (idx) => {
        for (const key of Object.keys(xinfaSlotsMap)) {
          xinfaSlotsMap[key] = xinfaSlotsMap[key].filter(
            (slot) => slot !== idx
          );
        }
        richSlots = richSlots.filter((slot) => slot !== idx);
      };
      const temp_slots = JSON.parse(JSON.stringify(team.slots));
      for (const [idx, slot] of temp_slots.entries()) {
        const { rule } = slot;
        if (slot.member?.is_lock) {
          continue;
        }
        slot.member = null;
        if (rule.allow_rich) {
          richSlots.push(idx);
        }
        for (const xinfa of rule.available_xinfa) {
          xinfaSlotsMap[xinfa].push(idx);
        }
      }

      let succ = true;
      const member_list = team.member_record.slice();
      while (member_list.length > 0) {
        member_list.sort((a, b) => {
          return xinfaSlotsMap[a.xinfa].length - xinfaSlotsMap[b.xinfa].length;
        });
        const first = member_list.shift();
        if (first.is_rich && richSlots.length > 0) {
          const slotIdx = richSlots.shift();
          temp_slots[slotIdx].member = first;
          consumeSlots(slotIdx);
        } else if (!first.is_rich && xinfaSlotsMap[first.xinfa].length > 0) {
          const slotIdx = xinfaSlotsMap[first.xinfa].shift();
          temp_slots[slotIdx].member = first;
          consumeSlots(slotIdx);
        } else if (
          team.candidates.find((candidate) => candidate.id === first.id)
        ) {
          continue;
        } else {
          succ = false;
          break;
        }
      }
      if (succ) {
        team.slots = temp_slots;
      }
      succSign = succ;
    }
    let resMessage = "报名成功";
    if (!succSign) {
      team.candidates.push(record);
      resMessage = `没有${
        is_rich ? "老板" : xinfaInfoTable[xinfa].nickname[0]
      }坑了，已经加入候补名单`;
    }
    await record.save();
    await team.save();
    res.json({
      message: resMessage,
      newTeam: team,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "报名失败",
    });
  }
};

exports.cancelSignup = async (req, res) => {
  try {
    const { uuid, recordId } = req.body;
    const team = await Team.findOne({ uuid })
      .populate("slots.member")
      .populate("candidates")
      .populate("member_record");
    team || res.status(404).json({ message: "未找到团队" });
    team.active || res.status(400).json({ message: "团队已关闭" });
    const memberIdx = team.member_record.findIndex(
      (member) => member._id.toString() === recordId
    );
    if (memberIdx === -1) {
      for (const slot of team.slots) {
        if (
          slot.member?.is_lock &&
          slot.member?.user.toString() === req.user.id.toString()
        ) {
          return res
            .status(400)
            .json({ message: "被团长钦定了，不能取消报名，肿么，你不服气？" });
        }
      }
      return res.status(400).json({ message: "你没有报名" });
    }
    team.member_record.splice(memberIdx, 1);
    for (const slot of team.slots) {
      if (slot.member?._id.toString() === recordId) {
        slot.member = null;
        break;
      }
    }
    team.candidates = team.candidates.filter(
      (candidate) => candidate._id.toString() !== recordId
    );
    await team.save();
    res.json({
      message: "取消报名成功",
      newTeam: team,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "取消报名失败",
    });
  }
};
