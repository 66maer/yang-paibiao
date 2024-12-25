import Mock from "mockjs";

Mock.mock("http://localhost:8080/api/v1/auth/login", "post", {
  code: 0,
  message: "ok",
  data: {
    token: "mock token",
    userId: 1,
    qqNumber: "123456789",
    nickname: "maer",
    avatar: "https://cdn.jsdelivr.net/gh/maerliu/maerliu.github.io/avatar.jpg",
  },
});

Mock.mock("http://localhost:8080/api/v1/auth/register", "post", {
  code: 0,
  message: "ok",
  data: {
    token: "mock token",
    userId: 1,
    qqNumber: "123456789",
    nickname: "maer",
    avatar: "https://cdn.jsdelivr.net/gh/maerliu/maerliu.github.io/avatar.jpg",
  },
});

Mock.mock("http://localhost:8080/api/v1/user/userinfo", "get", {
  code: 0,
  message: "ok",
  data: {
    token: "mock token",
    userId: 1,
    qqNumber: "123456789",
    nickname: "maer",
    avatar: "https://cdn.jsdelivr.net/gh/maerliu/maerliu.github.io/avatar.jpg",
  },
});
