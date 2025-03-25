import { createSlice } from "@reduxjs/toolkit";
import { request } from "@/utils/request";

const guildSlice = createSlice({
  name: "guild",
  initialState: {
    ukey: "zyhm", // 当前群组
    role: "member", // 当前群组中的角色
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

const fetchGetLeagueRole = () => {
  return async (dispatch) => {
    const ukey = "zyhm";
    const res = await request.get(`/guild/${ukey}/role`);
    console.log(res);
    if (res.code !== 0) {
      throw new Error(res.message);
    }
    dispatch(setRole(res.data.role));
  };
};

export { fetchGetLeagueRole, setCurLeague, setRole, setGuilds };
export default guildSlice.reducer;
