import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { Provider } from "react-redux";
import router from "./router/index";
import store from "./store/index";
import "./utils/mock";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <ConfigProvider
        locale={zhCN}
        theme={{
          token: { colorPrimary: "#ec9bad", borderRadius: 6 },
          components: {
            Layout: {
              headerBg: "#dc8b9d",
              bodyBg: "#e6d2d5",
              footerBg: "#dc8b9d",
              footerPadding: "5px 50px",
            },
            Menu: {
              horizontalItemSelectedColor: "#c04851",
              horizontalItemSelectedBg: "#f0c9cf",
              itemBg: "#dc8b9d",
            },
          },
        }}
      >
        <RouterProvider router={router} />
      </ConfigProvider>
    </Provider>
  </React.StrictMode>
);
