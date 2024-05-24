const express = require("express");
const router = express.Router();
const { verifyToken, verifyRole } = require("../utils/auth.js");
const TeamHandler = require("../handler/team.js");

router.post(
  "/getActiveTeam",
  verifyToken,
  verifyRole(["leader", "assistant", "member"]),
  TeamHandler.getActiveTeam
);

router.post(
  "/publishTeam",
  verifyToken,
  verifyRole(["leader", "assistant"]),
  TeamHandler.publishTeam
);

router.post(
  "/updateTeam",
  verifyToken,
  verifyRole(["leader", "assistant"]),
  TeamHandler.updateTeam
);

router.post(
  "/closeTeam",
  verifyToken,
  verifyRole(["leader", "assistant"]),
  TeamHandler.closeTeam
);

router.post(
  "/signup",
  verifyToken,
  verifyRole(["leader", "assistant", "member"]),
  TeamHandler.signup
);

router.post(
  "/cancelSignup",
  verifyToken,
  verifyRole(["leader", "assistant", "member"]),
  TeamHandler.cancelSignup
);

module.exports = router;
