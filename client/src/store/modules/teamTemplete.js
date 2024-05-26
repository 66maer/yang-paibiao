import { createSlice } from "@reduxjs/toolkit";

const tempTempleteStore = createSlice({
  name: "teamTemplete",
  initialState: {
    teamTemplete: [],
  },
  reducers: {
    setTeamTemplete(state, action) {
      state.teamTemplete = action.payload;
    },
    addTeamTemplete(state, action) {
      state.teamTemplete.push(action.payload);
    },
    removeTeamTemplete(state, action) {
      state.teamTemplete = state.teamTemplete.filter(
        (t) => t?.name !== action.payload
      );
    },
  },
});

export const { setTeamTemplete, addTeamTemplete, removeTeamTemplete } =
  tempTempleteStore.actions;
export default tempTempleteStore.reducer;
