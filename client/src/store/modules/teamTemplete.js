import { createSlice } from "@reduxjs/toolkit";
import { request } from "@/utils";

const tempTempleteStore = createSlice({
  name: "teamTemplete",
  initialState: {
    teamTemplete: [],
  },
  reducers: {
    setTeamTemplete(state, action) {
      state.teamTemplete = action.payload;
    },
  },
});

export const fetchTeamTemplete = () => async (dispatch) => {
  try {
    const res = await request.post("/getTeamTemplete");
    dispatch(setTeamTemplete(res));
  } catch (err) {
    console.error(err);
  }
};

export const { setTeamTemplete } = tempTempleteStore.actions;
export default tempTempleteStore.reducer;
