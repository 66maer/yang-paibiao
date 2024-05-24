const express = require("express");
const router = express.Router();
const { verifyToken, verifyRole } = require("../utils/auth.js");
const userHandler = require("../handler/user");

// 登录
router.post("/login", userHandler.login);

// 注册
router.post("/register", userHandler.register);

// 获取用户与当前组织身份信息
router.post(
  "/getUserInfo",
  verifyToken,
  verifyRole(["leader", "assistant", "member"]),
  userHandler.getUserInfo
);

// // 加入组织
// router.post("/joinLeague", verifyToken, userHandler.joinLeague);

// 获取角色列表
router.post("/getCharacter", verifyToken, userHandler.getCharacter);

// 添加或更新角色
router.post(
  "/addOrUpdateCharacter",
  verifyToken,
  userHandler.addOrUpdateCharacter
);

module.exports = router;
