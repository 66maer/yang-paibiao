import { createSlice } from "@reduxjs/toolkit";
import { request } from "@/utils";
import { setLocalToken, getLocalToken } from "@/utils/token";

const userStore = createSlice({
  name: "user",
  initialState: {
    token: getLocalToken() || "",
    id: "",
    nickname: "",
  },
  reducers: {
    setToken(state, action) {
      state.token = action.payload;
      setLocalToken(action.payload);
    },
    setUserInfo(state, action) {
      state.id = action.payload.id;
      state.nickname = action.payload.nickname;
    },
  },
});

const { setToken, setUserInfo } = userStore.actions;

const userReducer = userStore.reducer;

const fetchLogin = (loginForm) => {
  return async (dispatch) => {
    const res = await request.post("/login", loginForm);
    dispatch(setToken(res.token));
  };
};

const fetchRegister = (registerForm) => {
  return async (dispatch) => {
    const res = await request.post("/register", registerForm);
    dispatch(setToken(res.token));
  };
};

export { fetchLogin, fetchRegister, setToken, setUserInfo };

export default userReducer;
