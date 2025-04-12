import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./modules/user";
import guildReducer from "./modules/guild";

export const store = configureStore({
  reducer: {
    user: userReducer,
    guild: guildReducer,
  },
});
export default store;
