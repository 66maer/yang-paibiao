import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Switch,
  Divider,
  Chip,
} from "@heroui/react";
import { format } from "date-fns";
import { createTeam, updateTeam } from "../../api/teams";
import { showToast } from "../../utils/toast";

// 副本列表（暂时硬编码，未来从后端获取）
const DUNGEONS = [
  { value: "绝地天通", label: "绝地天通" },
  { value: "英雄太极宫", label: "英雄太极宫" },
  { value: "英雄天泣林", label: "英雄天泣林" },
  { value: "英雄磨刀楼", label: "英雄磨刀楼" },
  { value: "英雄寂灭殿", label: "英雄寂灭殿" },
  { value: "25H 红", label: "25H 红" },
  { value: "25H 橙", label: "25H 橙" },
  { value: "10H 橙武", label: "10H 橙武" },
];

/**
 * 开团编辑表单（全页面模式）
 */
export default function TeamEditForm({
  team = null,
  guildId,
  onSuccess,
  onCancel,
}) {
  const isEdit = !!team;
  const [loading, setLoading] = useState(false);

  // 表单数据
  const [formData, setFormData] = useState({
    title: "",
    team_time: "",
    dungeon: "",
    is_xuanjing_booked: false,
    is_yuntie_booked: false,
    is_hidden: false,
    is_locked: false,
    notice: "",
    use_template: false,
    no_specific_time: false,
  });

  // 初始化表单数据
  useEffect(() => {
    if (team) {
      setFormData({
        title: team.title || "",
        team_time: team.team_time
          ? format(new Date(team.team_time), "yyyy-MM-dd'T'HH:mm")
          : "",
        dungeon: team.dungeon || "",
        is_xuanjing_booked: team.is_xuanjing_booked || false,
        is_yuntie_booked: team.is_yuntie_booked || false,
        is_hidden: team.is_hidden || false,
        is_locked: team.is_locked || false,
        notice: team.notice || "",
        use_template: false,
        no_specific_time: !team.team_time,
      });
    } else {
      setFormData({
        title: "",
        team_time: "",
        dungeon: "",
        is_xuanjing_booked: false,
        is_yuntie_booked: false,
        is_hidden: false,
        is_locked: false,
        notice: "",
        use_template: false,
        no_specific_time: false,
      });
    }
  }, [team]);

  // 更新表单字段
  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // 自动生成标题
  const generateTitle = () => {
    const parts = [];

    if (formData.team_time && !formData.no_specific_time) {
      const date = new Date(formData.team_time);
      const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
      const weekday = weekdays[date.getDay()];
      const time = format(date, "HH:mm");
      parts.push(`${weekday} ${time}`);
    }

    if (formData.dungeon) {
      parts.push(formData.dungeon);
    }

    const generatedTitle = parts.join(" ");
    if (generatedTitle) {
      updateField("title", generatedTitle);
      showToast.success("标题已自动生成");
    } else {
      showToast.warning("请先选择时间和副本");
    }
  };

  // 提交表单
  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      showToast.error("请输入开团标题");
      return;
    }

    if (!formData.no_specific_time && !formData.team_time) {
      showToast.error("请选择发车时间或勾选「不指定时间」");
      return;
    }

    if (!formData.dungeon) {
      showToast.error("请选择副本");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        title: formData.title.trim(),
        team_time: formData.no_specific_time ? null : formData.team_time,
        dungeon: formData.dungeon,
        is_xuanjing_booked: formData.is_xuanjing_booked,
        is_yuntie_booked: formData.is_yuntie_booked,
        is_hidden: formData.is_hidden,
        is_locked: formData.is_locked,
        notice: formData.notice.trim(),
      };

      if (isEdit) {
        await updateTeam(guildId, team.id, payload);
        showToast.success("开团信息已更新");
      } else {
        await createTeam(guildId, payload);
        showToast.success("开团创建成功");
      }

      onSuccess?.();
    } catch (error) {
      console.error("保存开团失败:", error);
      showToast.error(error || "保存开团失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex items-center justify-between border-b border-pink-200 dark:border-pink-900">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
          {isEdit ? "✏️ 编辑开团" : "➕ 创建开团"}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            color="default"
            variant="light"
            onPress={onCancel}
            isDisabled={loading}
          >
            取消
          </Button>
          <Button
            color="primary"
            className="bg-gradient-to-r from-pink-500 to-purple-500"
            onPress={handleSubmit}
            isLoading={loading}
          >
            {isEdit ? "💾 保存修改" : "✨ 创建开团"}
          </Button>
        </div>
      </CardHeader>

      <CardBody className="overflow-auto">
        <div className="space-y-6 max-w-4xl">
          {/* 标题 */}
          <div className="flex items-end gap-2">
            <Input
              label="开团标题"
              placeholder="请输入开团标题"
              value={formData.title}
              onValueChange={(value) => updateField("title", value)}
              isRequired
              size="lg"
              classNames={{
                label: "text-pink-600 dark:text-pink-400 font-semibold",
              }}
            />
            <Button
              size="lg"
              color="secondary"
              variant="flat"
              onPress={generateTitle}
            >
              🪄 自动生成
            </Button>
          </div>

          <Divider />

          {/* 发车时间 */}
          <div className="space-y-2">
            <Input
              type="datetime-local"
              label="发车时间"
              value={formData.team_time}
              onValueChange={(value) => updateField("team_time", value)}
              isDisabled={formData.no_specific_time}
              isRequired={!formData.no_specific_time}
              size="lg"
              classNames={{
                label: "text-pink-600 dark:text-pink-400 font-semibold",
              }}
            />
            <Switch
              size="sm"
              isSelected={formData.no_specific_time}
              onValueChange={(value) => {
                updateField("no_specific_time", value);
                if (value) {
                  updateField("team_time", "");
                }
              }}
            >
              <span className="text-sm text-default-600">
                不指定具体时间
              </span>
            </Switch>
          </div>

          <Divider />

          {/* 副本选择 */}
          <Select
            label="选择副本"
            placeholder="请选择副本"
            selectedKeys={formData.dungeon ? [formData.dungeon] : []}
            onChange={(e) => updateField("dungeon", e.target.value)}
            isRequired
            size="lg"
            classNames={{
              label: "text-pink-600 dark:text-pink-400 font-semibold",
            }}
          >
            {DUNGEONS.map((dungeon) => (
              <SelectItem key={dungeon.value} value={dungeon.value}>
                {dungeon.label}
              </SelectItem>
            ))}
          </Select>

          <Divider />

          {/* 铁标记 */}
          <div>
            <h3 className="text-sm font-semibold text-pink-600 dark:text-pink-400 mb-3">
              铁标记设置
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-default-100 dark:bg-default-50">
                <Switch
                  isSelected={formData.is_xuanjing_booked}
                  onValueChange={(value) =>
                    updateField("is_xuanjing_booked", value)
                  }
                >
                  <span className="text-sm font-medium">💎 大铁已包</span>
                </Switch>
              </div>
              <div className="p-4 rounded-lg bg-default-100 dark:bg-default-50">
                <Switch
                  isSelected={formData.is_yuntie_booked}
                  onValueChange={(value) =>
                    updateField("is_yuntie_booked", value)
                  }
                >
                  <span className="text-sm font-medium">⚙️ 小铁已包</span>
                </Switch>
              </div>
            </div>
          </div>

          <Divider />

          {/* 可见性和锁定 */}
          <div>
            <h3 className="text-sm font-semibold text-pink-600 dark:text-pink-400 mb-3">
              高级设置
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-default-100 dark:bg-default-50">
                <Switch
                  isSelected={formData.is_hidden}
                  onValueChange={(value) => updateField("is_hidden", value)}
                >
                  <span className="text-sm font-medium">👁️ 仅管理员可见</span>
                </Switch>
                <p className="text-xs text-default-500 mt-1 ml-8">
                  开启后普通成员无法看到此开团
                </p>
              </div>
              <div className="p-4 rounded-lg bg-default-100 dark:bg-default-50">
                <Switch
                  isSelected={formData.is_locked}
                  onValueChange={(value) => updateField("is_locked", value)}
                >
                  <span className="text-sm font-medium">🔒 锁定报名</span>
                </Switch>
                <p className="text-xs text-default-500 mt-1 ml-8">
                  开启后将禁止新的报名
                </p>
              </div>
            </div>
          </div>

          <Divider />

          {/* 使用模板 */}
          <div>
            <h3 className="text-sm font-semibold text-pink-600 dark:text-pink-400 mb-3">
              模板设置
            </h3>
            <div className="p-4 rounded-lg bg-default-100 dark:bg-default-50">
              <Switch
                isSelected={formData.use_template}
                onValueChange={(value) => updateField("use_template", value)}
                isDisabled
              >
                <span className="text-sm text-default-400">
                  使用模板（功能开发中）
                </span>
              </Switch>
              {formData.use_template && (
                <Chip size="sm" variant="flat" color="warning" className="mt-2">
                  🚧 模板功能暂未实现
                </Chip>
              )}
            </div>
          </div>

          <Divider />

          {/* 团队告示 */}
          <div>
            <Textarea
              label="团队告示"
              placeholder="输入团队告示内容（可选）&#10;例如：&#10;- 准时集合，不要迟到&#10;- 自备食物和药品&#10;- 听从指挥"
              value={formData.notice}
              onValueChange={(value) => updateField("notice", value)}
              minRows={6}
              maxRows={12}
              classNames={{
                label: "text-pink-600 dark:text-pink-400 font-semibold",
              }}
            />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
