import { createSlice } from "@reduxjs/toolkit";
import { request } from "@/utils/request";
import { setLocalToken, getLocalToken } from "@/utils/token";

const userSlice = createSlice({
  name: "user",
  initialState: {
    token: getLocalToken() || "",
    userId: "",
    qqNumber: "",
    nickname: "",
    avatar: "",
    isSuperAdmin: false,
    isFetched: false,
  },
  reducers: {
    setToken(state, action) {
      state.token = action.payload;
      setLocalToken(action.payload);
    },
    setUserInfo(state, action) {
      state.userId = action.payload.userId || state.userId;
      state.qqNumber = action.payload.qqNumber || state.qqNumber;
      state.nickname = action.payload.nickname || state.nickname;
      state.avatar = action.payload.avatar || state.avatar;
      state.isSuperAdmin = action.payload.isSuperAdmin ?? state.isSuperAdmin;
      state.isFetched = true; // 设置标志为已获取
    },
  },
});

const { setToken, setUserInfo } = userSlice.actions;

const fetchLogin = (loginForm) => {
  return async (dispatch) => {
    const res = await request.post("/auth/login", loginForm);
    if (res.code !== 0) {
      throw new Error(res.msg);
    }
    dispatch(setToken(res.data.token));
    dispatch(
      setUserInfo({
        userId: res.data.userId,
        qqNumber: res.data.qqNumber,
        nickname: res.data.nickname,
        avatar: res.data.avatar,
        isSuperAdmin: res.data.isSuperAdmin,
      })
    );
  };
};

const fetchLogout = () => {
  return (dispatch) => {
    dispatch(setToken(""));
    dispatch(
      setUserInfo({
        userId: "",
        qqNumber: "",
        nickname: "",
        avatar: "",
        isSuperAdmin: false,
        isFetched: false,
      })
    );
  };
};

const fetchRegister = (registerForm) => {
  return async (dispatch) => {
    const res = await request.post("/auth/register", registerForm);
    if (res.code !== 0) {
      throw new Error(res.msg);
    }
    dispatch(setToken(res.data.token));
    dispatch(
      setUserInfo({
        userId: res.data.userId,
        qqNumber: res.data.qqNumber,
        nickname: res.data.nickname,
        avatar: res.data.avatar,
      })
    );
  };
};

const fetchUserInfo = () => {
  return async (dispatch, getState) => {
    const { token, userId, isFetched } = getState().user;
    if (userId || isFetched) {
      return; // 已经有用户信息或已获取过，直接返回
    }
    if (!token) {
      // 没有token，跳转到登录页
      window.location.href = "/login";
      return;
    }
    const res = await request.post("/user/getUserInfo", "{}");
    if (res.code !== 0) {
      throw new Error(res.msg);
    }
    dispatch(
      setUserInfo({
        userId: res.data.userId,
        qqNumber: res.data.qqNumber,
        nickname: res.data.nickname,
        avatar: res.data.avatar,
        isSuperAdmin: res.data.isAdmin,
      })
    );
  };
};

const fetchChangePassword = (changePasswordForm) => {
  return async (dispatch) => {
    const res = await request.post("/user/changePassword", changePasswordForm);
    if (res.code !== 0) {
      throw new Error(res.msg);
    }
  };
};

const fetchChangeUserInfo = (changeUserInfoForm) => {
  return async (dispatch) => {
    const res = await request.post("/user/updateUserInfo", changeUserInfoForm);
    if (res.code !== 0) {
      throw new Error(res.msg);
    }
    dispatch(
      setUserInfo({
        nickname: changeUserInfoForm.nickname,
      })
    );
  };
};

export {
  fetchLogin,
  fetchLogout,
  fetchRegister,
  fetchUserInfo,
  fetchChangePassword,
  fetchChangeUserInfo,
  setToken,
  setUserInfo,
};

export default userSlice.reducer;
