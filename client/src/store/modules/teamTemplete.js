import { createSlice } from "@reduxjs/toolkit";
import { request } from "@/utils";

const tempTempleteStore = createSlice({
  name: "teamTemplete",
  initialState: {
    teamTemplete: [],
  },
  reducers: {
    updateTeamTemplete(state, action) {
      const getTeamTemplete = async () => {
        try {
          const res = await request.post("/getTeamTemplete");
          state.teamTemplete = res;
        } catch (err) {
          console.log(err);
        }
      };

      getTeamTemplete();
    },
  },
});

export const { updateTeamTemplete } = tempTempleteStore.actions;
export default tempTempleteStore.reducer;
