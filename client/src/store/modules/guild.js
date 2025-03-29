import { createSlice } from "@reduxjs/toolkit";
import { request } from "@/utils/request";

const guildSlice = createSlice({
  name: "guild",
  initialState: {
    guildId: 1, // 当前群组ID (目前不考虑做多群组，只有一个)
    ukey: "zyhm", // 当前群组 (目前不考虑做多群组，只有一个)
    role: "member", // 当前群组中的角色
    guilds: ["zyhm"], // 当前用户所在的所有群组
    guildMembers: {}, // 缓存群组成员数据
  },
  reducers: {
    setCurLeague(state, action) {
      state.curLeague = action.payload;
    },
    setRole(state, action) {
      state.role = action.payload;
    },
    setGuilds(state, action) {
      state.guilds = action.payload;
    },
    setGuildMembers(state, action) {
      const { guildId, members } = action.payload;
      state.guildMembers[guildId] = members;
    },
  },
});

const { setCurLeague, setRole, setGuilds, setGuildMembers } =
  guildSlice.actions;

const fetchGetLeagueRole = (userId) => {
  return async (dispatch) => {
    const field = {
      guildId: 1,
      userId: userId,
    };
    const res = await request.post(`/guild/getGuildMember`, field);
    if (res.code !== 0) {
      throw new Error(res.msg);
    }
    dispatch(setRole(res.data.memberInfo.groupRole));
  };
};

const fetchGuildMembers = (guildId) => {
  return async (dispatch) => {
    const res = await request.post("/guild/listGuildMembers", { guildId });
    if (res.code !== 0) {
      throw new Error(res.msg);
    }
    return res.data.memberInfo;
  };
};

const fetchGuildMembersWithCache = (guildId) => {
  return async (dispatch, getState) => {
    const { guildMembers } = getState().guild;
    if (guildMembers[guildId]) {
      return guildMembers[guildId]; // 返回缓存数据
    }
    const res = await request.post("/guild/listGuildMembers", { guildId });
    if (res.code !== 0) {
      throw new Error(res.msg);
    }
    dispatch(setGuildMembers({ guildId, members: res.data.members }));
    return res.data.members;
  };
};

export {
  fetchGetLeagueRole,
  fetchGuildMembers,
  fetchGuildMembersWithCache,
  setCurLeague,
  setRole,
  setGuilds,
};
export default guildSlice.reducer;
