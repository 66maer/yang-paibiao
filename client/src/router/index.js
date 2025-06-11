import { createBrowserRouter } from "react-router-dom";
import { Children } from "react";
import MainPage from "../pages/MainPage";
import LoginPage from "../pages/Login";
import { AuthRoute } from "@/components/AuthRoute";
import { Navigate } from "react-router-dom";
import BoardPage from "../pages/Board";
import GuildMember from "@/pages/GuildMember";
import Character from "@/pages/Character";
import BoardEditContent from "../pages/Board/edit"; // 导入编辑页面组件
import TeamTemplate from "@/pages/TeamTemplete";
import HistoryTeams from "@/pages/HistoryTeams";
import Screenshot from "../pages/Screenshot";
import Tools from "@/pages/Tools";
import SubsidyCalculator from "@/pages/Tools/SubsidyCalculator";

const routers = [
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/screenshot",
    Component: Screenshot,
  },
  {
    path: "/",
    element: (
      <AuthRoute>
        <MainPage />
      </AuthRoute>
    ),
    children: [
      {
        path: "/", // 重定向到teamBoard
        element: <Navigate to="board" />,
      },
      {
        path: "board/:teamId?",
        element: <BoardPage />,
      },
      {
        path: "board/edit/:teamId?", // 修复编辑页面路由
        element: <BoardEditContent />,
      },
      {
        path: "members",
        element: <GuildMember />,
      },
      {
        path: "characters",
        element: <Character />,
      },
      {
        path: "team-template",
        element: <TeamTemplate />,
      },
      {
        path: "history-teams",
        element: <HistoryTeams />,
      },
      {
        path: "tools",
        element: <Tools />,
        children: [
          {
            path: "",
            element: <Navigate to="subsidy-calculator" />,
          },
          {
            path: "subsidy-calculator",
            element: <SubsidyCalculator />,
          },
        ],
      },
      // 可以在这里添加更多需要登录校验的子路由
    ],
  },
];

export default createBrowserRouter(routers);
