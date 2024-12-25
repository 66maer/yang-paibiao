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
    isFetched: false, // 新增标志
  },
  reducers: {
    setToken(state, action) {
      state.token = action.payload;
      setLocalToken(action.payload);
    },
    setUserInfo(state, action) {
      state.id = action.payload.id;
      state.qqNumber = action.payload.qqNumber;
      state.nickname = action.payload.nickname;
      state.avatar = action.payload.avatar;
      state.isFetched = true; // 设置标志为已获取
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

const fetchUserInfo = () => {
  return async (dispatch, getState) => {
    const { token, id, isFetched } = getState().user;
    if (id || isFetched) {
      return; // 已经有用户信息或已获取过，直接返回
    }
    if (!token) {
      // 没有token，跳转到登录页
      window.location.href = "/login";
      return;
    }
    try {
      const res = await request.get("/user/userinfo", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.code !== 0) {
        throw new Error(res.message);
      }
      dispatch(
        setUserInfo({
          id: res.data.id,
          qqNumber: res.data.qqNumber,
          nickname: res.data.nickname,
          avatar: res.data.avatar,
        })
      );
    } catch (error) {
      alert("Token 已过期，请重新登录");
      window.location.href = "/login";
    }
  };
};

export { fetchLogin, fetchRegister, setToken, setUserInfo, fetchUserInfo };

export default userSlice.reducer;
