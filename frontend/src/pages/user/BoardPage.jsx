import { Card, CardBody } from "@heroui/react";

/**
 * 开团看板页面（占位页面）
 */
export default function BoardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
          📋 开团看板
        </h1>
      </div>

      <Card className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30">
        <CardBody className="p-12">
          <div className="text-center space-y-4">
            <div className="text-6xl">🚧</div>
            <h2 className="text-2xl font-bold text-pink-600 dark:text-pink-400">
              功能开发中
            </h2>
            <p className="text-default-600">
              开团看板功能正在开发中，敬请期待...
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
