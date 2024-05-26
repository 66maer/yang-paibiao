import { createSlice } from "@reduxjs/toolkit";

const leagueStore = createSlice({
  name: "league",
  initialState: {
    curLeague: "zyhm",
    role: "guest",
  },
  reducers: {
    setCurLeague(state, action) {
      state.curLeague = action.payload;
    },
    setRole(state, action) {
      state.role = action.payload;
    },
  },
});

export const { setCurLeague, setRole } = leagueStore.actions;
export default leagueStore.reducer;
