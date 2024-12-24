import { createBrowserRouter } from "react-router-dom";
import { Children } from "react";
import MainPage from "../pages/MainPage";
import LoginPage from "../pages/Login";
import { AuthRoute } from "@/components/AuthRoute";

const routers = [
  {
    path: "/",
    element: (
      <AuthRoute>
        <MainPage />
      </AuthRoute>
    ),
  },
  {
    path: "/login",
    Component: LoginPage,
  },
];

export default createBrowserRouter(routers);
