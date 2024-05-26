import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./modules/user";
import leagueReducer from "./modules/league";
import teamTempleteReducer from "./modules/teamTemplete";
import teamTemplete from "./modules/teamTemplete";

export const store = configureStore({
  reducer: {
    user: userReducer,
    league: leagueReducer,
    teamTemplete: teamTempleteReducer,
  },
});
export default store;
