import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card, CardBody, CardHeader, Input, Textarea } from "@heroui/react";
import useAuthStore from "../../stores/authStore";
import TeamBoard from "../../components/board/TeamBoard/TeamBoard";
import { buildEmptyRules } from "../../utils/slotAllocation";
import { createTemplate, getTemplateDetail, updateTemplate } from "../../api/templates";
import { showToast } from "../../utils/toast";

export default function TemplateEditPage() {
  const navigate = useNavigate();
  const { templateId } = useParams();
  const isEdit = !!templateId;
  const { user } = useAuthStore();
  const currentGuild = user?.guilds?.find((g) => g.id === user?.current_guild_id);

  const [title, setTitle] = useState("");
  const [notice, setNotice] = useState("");
  const [rules, setRules] = useState(buildEmptyRules());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!isEdit || !currentGuild?.id) return;
      try {
        const resp = await getTemplateDetail(currentGuild.id, templateId);
        const d = resp.data;
        setTitle(d.title || "");
        setNotice(d.notice || "");
        setRules(Array.isArray(d.rules) && d.rules.length ? d.rules : buildEmptyRules());
      } catch (e) {
        showToast.error(e || "加载模板失败");
        navigate("/templates");
      }
    };
    run();
  }, [isEdit, templateId, currentGuild?.id]);

  const handleRuleChange = (slotIndex, nextRule) => {
    setRules((prev) => {
      const next = [...prev];
      next[slotIndex] = { ...next[slotIndex], ...nextRule };
      return next;
    });
  };

  const handleSave = async () => {
    if (!currentGuild?.id) return;
    if (notice.length > 2000) {
      showToast.error("团队告示不能超过2000字");
      return;
    }
    try {
      setSaving(true);
      const payload = { title: title?.trim() || null, notice, rules };
      if (isEdit) {
        await updateTemplate(currentGuild.id, templateId, payload);
        showToast.success("模板已更新");
      } else {
        await createTemplate(currentGuild.id, payload);
        showToast.success("模板已创建");
      }
      navigate("/templates");
    } catch (e) {
      showToast.error(e || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const headerTitle = isEdit ? "编辑模板" : "新建模板";

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div className="text-xl font-bold text-pink-600 dark:text-pink-400">{headerTitle}</div>
          <div className="flex gap-2">
            <Button variant="light" onPress={() => navigate("/templates")} isDisabled={saving}>
              取消
            </Button>
            <Button color="primary" onPress={handleSave} isLoading={saving}>
              保存
            </Button>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <Input label="模板标题（可选）" value={title} onValueChange={setTitle} maxLength={50} />

          <Textarea
            label="团队告示"
            placeholder="输入团队告示（可选）"
            value={notice}
            onValueChange={setNotice}
            minRows={6}
            maxRows={12}
            maxLength={2000}
            description={`${notice.length}/2000`}
          />

          <div>
            <div className="text-sm font-semibold text-pink-600 dark:text-pink-400 mb-3">团队面板（规则编辑模式）</div>
            <TeamBoard rules={rules} signupList={[]} mode="edit-rule" onRuleChange={handleRuleChange} />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
