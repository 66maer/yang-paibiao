import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./modules/user";
import leagueReducer from "./modules/league";

export const store = configureStore({
  reducer: {
    user: userReducer,
    league: leagueReducer,
  },
});
export default store;
