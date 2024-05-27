import App from "@/pages/App";
import Login from "@/pages/Login";
import TeamBoard from "@/pages/TeamBoard";
import TeamEdit from "@/pages/TeamEdit";
import TeamTemplete from "@/pages/TeamTemplete";
import ManageLeague from "@/pages/ManageLeague";
import UserCharacter from "@/pages/UserCharacter";
import CareerHistory from "@/pages/CareerHistory";
import TeamHistory from "@/pages/TeamHistory";
import Publish from "@/pages/TeamEdit/Publish";
import EditTemplate from "@/pages/TeamTemplete/EditTemplete";
import TestPage from "@/pages/Test/test";
import { Navigate } from "react-router-dom";

import { createBrowserRouter } from "react-router-dom";
import { AuthRoute } from "@/components/AuthRoute";
import Version from "@/pages/Version";
const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AuthRoute>
        <App />
      </AuthRoute>
    ),
    children: [
      {
        path: "/", // 重定向到teamBoard
        element: <Navigate to="teamBoard" />,
      },
      {
        path: "teamBoard",
        element: <TeamBoard />,
      },
      {
        path: "teamEdit",
        element: <TeamEdit />,
      },
      {
        path: "teamTemplete",
        element: <TeamTemplete />,
      },
      {
        path: "manageLeague",
        element: <ManageLeague />,
      },
      {
        path: "UserCharacter",
        element: <UserCharacter />,
      },
      {
        path: "CareerHistory",
        element: <CareerHistory />,
      },
      {
        path: "TeamHistory",
        element: <TeamHistory />,
      },
      {
        path: "teamEdit/edit",
        element: <Publish />,
      },
      {
        path: "teamTemplete/edit",
        element: <EditTemplate />,
      },
      {
        path: "version",
        element: <Version />,
      },
    ],
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/test",
    element: <TestPage />,
  },
]);

export default router;
