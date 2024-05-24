const jwt = require("jsonwebtoken");
const User = require("../models/user");
const League = require("../models/league");

const verifyToken = async (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1]; // "Bearer TOKEN"

  if (!token) {
    return res.status(403).send("无效的token");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    const user = await User.findOne({ qqNumber: req.user.qqNumber });
    if (!user) {
      return res.status(404).send("用户不存在");
    }
    req.user.nickname = user.nickname;
  } catch (err) {
    return res.status(401).send("Invalid Token");
  }

  return next();
};

const verifyRole = (roles) => (req, res, next) => {
  const curLeague = req.headers["curleague"];
  User.findOne({ qqNumber: req.user.qqNumber })
    .then((user) => {
      League.findOne({ leagueKey: curLeague })
        .then((league) => {
          if (!league) {
            return res.status(404).send("不存在的组织");
          }
          req.curLeagueId = league._id;
          if (league.leagueLeader.equals(user._id)) {
            req.role = "leader";
          } else if (league.leagueAssistant.includes(user._id)) {
            req.role = "assistant";
          } else if (league.leagueMember.includes(user._id)) {
            req.role = "member";
          } else {
            req.role = "guest";
          }
          if (roles.includes(req.role)) {
            return next();
          } else {
            return res.status(403).send("权限不足");
          }
        })
        .catch((err) => {
          return res.status(500).send("Internal Server Error");
        });
    })
    .catch((err) => {
      return res.status(500).send("Internal Server Error");
    });
};

module.exports = {
  verifyToken,
  verifyRole,
};
