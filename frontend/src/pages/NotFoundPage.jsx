import { useNavigate } from "react-router-dom";
import { Button } from "@heroui/react";
import useAuthStore from "@/stores/authStore";

/**
 * 404 页面未找到
 */
export default function NotFoundPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  const handleGoHome = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (user?.role === "admin") {
      navigate("/admin");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          {/* 404 图片 */}
          <div className="mb-6 flex justify-center">
            <img src="/404.png" alt="404" className="w-64 h-auto object-contain animate-pulse" />
          </div>

          <h1 className="text-9xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            404
          </h1>
          <h2 className="text-2xl font-semibold text-default-700 dark:text-default-300 mt-4">页面未找到</h2>
          <p className="text-default-500 mt-2">抱歉，你访问的页面不存在或已被删除</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            color="primary"
            size="lg"
            variant="shadow"
            onPress={handleGoHome}
            className="bg-gradient-to-r from-pink-500 to-purple-600"
          >
            返回首页
          </Button>
          <Button
            size="lg"
            variant="bordered"
            onPress={() => navigate(-1)}
            className="border-pink-200 dark:border-pink-800"
          >
            返回上一页
          </Button>
        </div>

        <div className="mt-12 text-default-400 text-sm">
          <p>如果你认为这是一个错误，请联系管理员</p>
        </div>
      </div>
    </div>
  );
}
