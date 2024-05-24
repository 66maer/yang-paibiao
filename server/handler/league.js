const User = require("../models/user");
const League = require("../models/league");

exports.createLeague = async (req, res) => {
  const { leagueGroupNumber, leagueName, leagueKey, leagueServer } = req.body;
  const user = await User.findOne({ qqNumber: req.user.qqNumber });
  const league = await League.findOne({ leagueKey: leagueKey });
  if (league) {
    res.status(400).send({ message: "该团已被注册" });
  } else {
    try {
      const newLeague = await League.create({
        leagueGroupNumber,
        leagueName,
        leagueKey,
        leagueServer,
        leagueLeader: user._id,
      });
      await user.joinLeague(newLeague._id, "leader");
      res.status(201).send(newLeague);
    } catch (err) {
      res.status(400).send({ message: "团创建失败: " + err.message });
    }
  }
};
