import { createSlice } from "@reduxjs/toolkit";
import { request } from "@/utils/request";
import { setLocalToken, getLocalToken } from "@/utils/token";

const userSlice = createSlice({
  name: "user",
  initialState: {
    token: getLocalToken() || "",
    id: "",
    qqNumber: "",
    nickname: "",
    avatar: "",
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

const { setToken, setUserInfo } = userSlice.actions;

const fetchLogin = (loginForm) => {
  return async (dispatch) => {
    const res = await request.post("/auth/login", loginForm);
    if (res.code !== 0) {
      throw new Error(res.message);
    }
    dispatch(setToken(res.data.token));
    dispatch(
      setUserInfo({
        id: res.data.id,
        qqNumber: res.data.qqNumber,
        nickname: res.data.nickname,
        avatar: res.data.avatar,
      })
    );
  };
};

const fetchRegister = (registerForm) => {
  return async (dispatch) => {
    const res = await request.post("/auth/register", registerForm);
    if (res.code !== 0) {
      throw new Error(res.message);
    }
    dispatch(setToken(res.data.token));
    dispatch(
      setUserInfo({
        id: res.data.id,
        qqNumber: res.data.qqNumber,
        nickname: res.data.nickname,
        avatar: res.data.avatar,
      })
    );
  };
};

export { fetchLogin, fetchRegister, setToken, setUserInfo };

export default userSlice.reducer;
