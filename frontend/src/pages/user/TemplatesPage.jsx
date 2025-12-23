import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, CardBody, CardHeader, Spinner } from "@heroui/react";
import useAuthStore from "../../stores/authStore";
import { getTemplateList, deleteTemplate } from "../../api/templates";
import { showToast } from "../../utils/toast";

export default function TemplatesPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const currentGuild = user?.guilds?.find((g) => g.id === user?.current_guild_id);
  const role = currentGuild?.role || "member";
  const canManage = ["owner", "helper"].includes(role);

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  const load = async () => {
    if (!currentGuild?.id) return;
    try {
      setLoading(true);
      const resp = await getTemplateList(currentGuild.id);
      setItems(resp.data || []);
    } catch (e) {
      showToast.error(e || "加载模板失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [currentGuild?.id]);

  if (!currentGuild) {
    return (
      <div className="p-6">
        <Card>
          <CardBody>请先选择一个群组</CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-pink-600 dark:text-pink-400">开团模板</h2>
        {canManage && (
          <Button color="primary" onPress={() => navigate("/templates/new")}>
            新建模板
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>模板列表</CardHeader>
        <CardBody>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Spinner />
            </div>
          ) : items.length === 0 ? (
            <div className="text-default-500">暂无模板</div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {items.map((it) => (
                <div key={it.id} className="p-4 rounded-lg border border-default-200 bg-default-50">
                  <div className="font-semibold mb-2">{it.title || `模板 #${it.id}`}</div>
                  <div className="text-xs text-default-500 line-clamp-3 mb-3">{it.notice || "(无告示)"}</div>
                  <div className="flex gap-2">
                    <Button size="sm" onPress={() => navigate(`/templates/${it.id}/edit`)}>
                      编辑
                    </Button>
                    {canManage && (
                      <Button
                        size="sm"
                        color="danger"
                        variant="flat"
                        onPress={async () => {
                          try {
                            await deleteTemplate(currentGuild.id, it.id);
                            showToast.success("已删除");
                            load();
                          } catch (e) {
                            showToast.error(e || "删除失败");
                          }
                        }}
                      >
                        删除
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
