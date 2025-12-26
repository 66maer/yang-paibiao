import { Card, CardBody } from "@heroui/react";

/**
 * 历史开团页面
 */
export default function HistoryPage() {
  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-4xl mx-auto">
        <CardBody className="text-center py-20">
          <div className="text-6xl mb-4">📜</div>
          <h1 className="text-2xl font-bold mb-2">历史开团</h1>
          <p className="text-default-500">功能开发中，敬请期待...</p>
        </CardBody>
      </Card>
    </div>
  );
}
