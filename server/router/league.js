const express = require("express");
const router = express.Router();
const { verifyToken } = require("../utils/auth");
const LeagueHandler = require("../handler/league.js");

// 创建组织
router.post("/createLeague", verifyToken, LeagueHandler.createLeague);

module.exports = router;
