import { createBrowserRouter } from "react-router-dom";
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
import SubsidyCalculatorV3 from "@/pages/Tools/SubsidyCalculatorV3";
import SchedulePlanner from "@/pages/Tools/SchedulePlanner";

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
            element: <Navigate to="subsidy-calculator-v3" />,
          },
          {
            path: "subsidy-calculator-v3",
            element: <SubsidyCalculatorV3 />,
          },
          {
            path: "schedule-planner",
            element: <SchedulePlanner />,
          },
        ],
      },
      // 可以在这里添加更多需要登录校验的子路由
    ],
  },
];

export default createBrowserRouter(routers);
