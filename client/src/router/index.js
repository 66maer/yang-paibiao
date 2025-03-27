import { createBrowserRouter } from "react-router-dom";
import { Children } from "react";
import MainPage from "../pages/MainPage";
import LoginPage from "../pages/Login";
import { AuthRoute } from "@/components/AuthRoute";
import { Navigate } from "react-router-dom";
import BoardPage from "../pages/Board";
import GuildMember from "@/pages/GuildMember";

const routers = [
  {
    path: "/login",
    Component: LoginPage,
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
        path: "board",
        element: <BoardPage />,
      },
      {
        path: "members",
        element: <GuildMember />,
      },
      // 可以在这里添加更多需要登录校验的子路由
    ],
  },
];

export default createBrowserRouter(routers);
