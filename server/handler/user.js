const User = require("../models/user");
const League = require("../models/league");
const jwt = require("jsonwebtoken");

// 用户注册
exports.register = async (req, res) => {
  const { qqNumber, password, nickname } = req.body;
  const user = await User.findOne({ qqNumber });
  if (user) {
    res.status(400).send({ message: "该用户已存在" });
  } else {
    try {
      const newUser = await User.create({ qqNumber, password, nickname });
      // debug: 暂时默认加入花眠
      const league = await League.findOne({ leagueKey: "zyhm" });
      if (league) {
        await newUser.joinLeague(league._id, "member");
        await league.addMember(newUser._id);
      }

      const token = jwt.sign(
        { qqNumber: newUser.qqNumber },
        process.env.JWT_SECRET
      );
      res.status(201).json({
        message: "注册成功",
        token,
      });
    } catch (err) {
      res.status(400).json({ message: "用户注册失败:" + err.message });
    }
  }
};

// 用户登录
exports.login = async (req, res) => {
  console.log("登录...");
  const { qqNumber, password } = req.body;
  const user = await User.findOne({ qqNumber });
  if (!user) {
    res.status(400).send({ message: "用户不存在" });
  } else if (user.password === password) {
    console.log("登录...222");
    const token = jwt.sign(
      {
        id: user._id,
        qqNumber: user.qqNumber,
      },
      process.env.JWT_SECRET
    );
    console.log("登录成功", token);
    res.json({
      message: "登录成功",
      token,
      id: user._id,
      nickname: user.nickname,
    });
  } else {
    res.status(401).send({ message: "用户名或密码错误" });
  }
};

exports.getUserInfo = async (req, res) => {
  res.status(200).send({
    role: req.role,
    id: req.user.id,
    nickname: req.user.nickname,
    qqNumber: req.user.qqNumber,
  });
};

// 加入组织
exports.joinLeague = async (req, res) => {
  const { leagueId } = req.body;
  const user = await User.findOne({ qqNumber: req.user.qqNumber });
  const league = await League.findById(leagueId);
  if (!league) {
    res.status(404).send({ message: "组织不存在" });
  } else {
    await user.joinLeague(leagueId, "member");
    res.status(201).send(user);
  }
};

// 获取角色列表
exports.getCharacter = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user.characters);
  } catch (err) {
    console.log(err);
    res.status(500).send("角色列表获取失败");
  }
};

// 添加或更新角色
exports.addOrUpdateCharacter = async (req, res) => {
  const { character } = req.body;
  try {
    const user = await User.findById(req.user.id);
    const characters = user.characters;
    const index = characters.findIndex(
      (c) => c.characterName === character.characterName
    );
    if (index === -1) {
      characters.push(character);
    } else {
      characters[index] = character;
    }
    user.characters = characters;
    await user.save();
    res.json(user.characters);
  } catch (err) {
    console.log(err);
    res.status(500).send("更新角色失败");
  }
};
