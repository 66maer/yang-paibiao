// 引入 express 框架
const express = require("express");
const mongoose = require("mongoose"); // 引入 mongoose 库
// 创建一个 express 应用
const app = express();
// 引入 cors 库，用于处理跨域问题
const cors = require("cors");
// 使用 cors 中间件，允许所有的请求都可以跨域
app.use(cors());
// 使用 express 内置的中间件，用于解析请求体中的 json 格式数据
app.use(express.json());
const userRouter = require("./router/user");
const leagueRouter = require("./router/league");
const teamRouter = require("./router/team");
app.use("/api", userRouter);
app.use("/api", leagueRouter);
app.use("/api", teamRouter);

// 从环境变量中获取 MongoDB 连接字符串，如果没有设置，则默认连接到本地的 MongoDB 服务
const mongoURI =
  process.env.MONGO_DB_URI || "mongodb://localhost:27017/paibiao_test";
// 连接到 MongoDB 数据库
mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected successfully:" + mongoURI);
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

// 从环境变量中获取端口号，如果没有设置，则默认为 5000
const port = process.env.PORT || 5000;

// 让应用开始监听指定的端口，等待网络请求
app.listen(port, () => {
  // 当应用开始监听端口时，打印出提示信息
  console.log(`Server is running on port ${port}`);
});
