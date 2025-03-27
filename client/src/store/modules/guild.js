import { createSlice } from "@reduxjs/toolkit";
import { request } from "@/utils/request";

const guildSlice = createSlice({
  name: "guild",
  initialState: {
    guildId: 1, // 当前群组ID (目前不考虑做多群组，只有一个)
    ukey: "zyhm", // 当前群组 (目前不考虑做多群组，只有一个)
    role: "普通成员", // 当前群组中的角色
    guilds: ["zyhm"], // 当前用户所在的所有群组
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
  },
});

const { setCurLeague, setRole, setGuilds } = guildSlice.actions;

const fetchGetLeagueRole = (userId) => {
  return async (dispatch) => {
    const field = {
      guildId: 1,
      userId: userId,
    };
    const res = await request.post(`/guild/getGuildMember`, field);
    console.log(res);
    if (res.code !== 0) {
      throw new Error(res.message);
    }
    dispatch(setRole(res.data.role));
  };
};

const fetchGuildMembers = (guildId) => {
  return async (dispatch) => {
    const res = await request.post("/guild/listGuildMembers", { guildId });
    if (res.code !== 0) {
      throw new Error(res.message);
    }
    return res.data.members;
  };
};

export {
  fetchGetLeagueRole,
  fetchGuildMembers,
  setCurLeague,
  setRole,
  setGuilds,
};
export default guildSlice.reducer;
