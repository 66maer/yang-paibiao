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
  DatePicker,
} from "@heroui/react";
import { format } from "date-fns";
import { parseDateTime, now, getLocalTimeZone } from "@internationalized/date";
import { createTeam, updateTeam } from "../../api/teams";
import { showToast } from "../../utils/toast";
import { getTemplateList, createTemplate } from "../../api/templates";
import TeamBoard from "./TeamBoard/TeamBoard";
import { buildEmptyRules } from "../../utils/slotAllocation";
import useAuthStore from "../../stores/authStore";

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
 * 开团编辑表单
 */
export default function TeamEditForm({ team = null, guildId, onSuccess, onCancel }) {
  const isEdit = !!team;
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();

  // 右侧帮助提示组件
  const HelpPanel = () => (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <h3 className="text-lg font-bold text-pink-600 dark:text-pink-400">💡 编辑提示</h3>
      </CardHeader>
      <Divider />
      <CardBody className="overflow-auto">
        <div className="space-y-4 text-sm">
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
            <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">🪄 自动生成标题</h4>
            <p className="text-default-600 text-xs">填写完时间和副本后，点击「自动生成」按钮可以快速生成标题</p>
          </div>

          <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20">
            <h4 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">⏰ 不指定时间</h4>
            <p className="text-default-600 text-xs">适用于活动团、排表团等不需要具体时间的开团</p>
          </div>

          <div className="p-3 rounded-lg bg-pink-50 dark:bg-pink-950/20">
            <h4 className="font-semibold text-pink-600 dark:text-pink-400 mb-2">💎 大小铁标记</h4>
            <p className="text-default-600 text-xs">大铁（玄晶）和小铁（陨铁）是否已被预定</p>
          </div>

          <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20">
            <h4 className="font-semibold text-orange-600 dark:text-orange-400 mb-2">🔒 权限设置</h4>
            <p className="text-default-600 text-xs">
              • 仅管理员可见：隐藏开团，普通成员看不到，群机器人也查不到
              <br />• 锁定自由报名：开启后禁止普通用户自由报名 （一般是排表模式）
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );

  // 获取当天 19:30 的默认时间（CalendarDateTime 格式）
  const getDefaultDateTime = () => {
    const currentDate = now(getLocalTimeZone());
    return currentDate.set({ hour: 19, minute: 30, second: 0, millisecond: 0 });
  };

  // 获取当天指定时间
  const getTodayTime = (hour, minute) => {
    const currentDate = now(getLocalTimeZone());
    return currentDate.set({ hour, minute, second: 0, millisecond: 0 });
  };

  // 将 ISO 字符串转换为 CalendarDateTime
  const isoToCalendarDateTime = (isoString) => {
    if (!isoString) return null;
    try {
      // 将 "2024-06-15T19:30" 格式转换为 "2024-06-15T19:30:00"
      const withSeconds = isoString.includes(":") && isoString.split(":").length === 2 ? `${isoString}:00` : isoString;
      return parseDateTime(withSeconds);
    } catch (error) {
      console.error("日期转换错误:", error);
      return null;
    }
  };

  // 将 CalendarDateTime 转换为 ISO 字符串（用于 API）
  const calendarDateTimeToISO = (calendarDateTime) => {
    if (!calendarDateTime) return null;
    const { year, month, day, hour, minute } = calendarDateTime;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(
      2,
      "0"
    )}:${String(minute).padStart(2, "0")}`;
  };

  // 表单数据
  const [formData, setFormData] = useState({
    title: "",
    team_time: getDefaultDateTime(),
    dungeon: "",
    is_xuanjing_booked: false,
    is_yuntie_booked: false,
    is_hidden: false,
    is_locked: false,
    notice: "",
    use_template: false,
    no_specific_time: false,
    auto_generate_title: !isEdit, // 新建默认开启，编辑默认关闭
    selected_template: "",
  });

  // 团队面板：规则数组（在创建/编辑团队时用于“保存为模板”或“应用模板”）
  const [boardRules, setBoardRules] = useState(buildEmptyRules());

  // 模板列表
  const [templates, setTemplates] = useState([]);
  const [tplLoading, setTplLoading] = useState(false);

  // 初始化表单数据
  useEffect(() => {
    if (team) {
      setFormData({
        title: team.title || "",
        team_time: team.team_time
          ? isoToCalendarDateTime(format(new Date(team.team_time), "yyyy-MM-dd'T'HH:mm"))
          : getDefaultDateTime(),
        dungeon: team.dungeon || "",
        is_xuanjing_booked: team.is_xuanjing_booked || false,
        is_yuntie_booked: team.is_yuntie_booked || false,
        is_hidden: team.is_hidden || false,
        is_locked: team.is_locked || false,
        notice: team.notice || "",
        use_template: false,
        no_specific_time: !team.team_time,
        auto_generate_title: false, // 编辑模式默认关闭
        selected_template: "",
      });
      // 加载团队的规则数据
      if (Array.isArray(team.rules) && team.rules.length > 0) {
        setBoardRules(team.rules);
      } else {
        setBoardRules(buildEmptyRules());
      }
    }
  }, [team]);

  // 加载模板列表
  useEffect(() => {
    const loadTemplates = async () => {
      if (!guildId) return;
      try {
        setTplLoading(true);
        const resp = await getTemplateList(guildId);
        setTemplates(resp.data || []);
      } catch (e) {
        // 列表失败不阻塞开团表单
        console.warn("加载模板列表失败", e);
      } finally {
        setTplLoading(false);
      }
    };
    loadTemplates();
  }, [guildId]);

  // 更新表单字段
  const updateField = (field, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // 如果修改了时间、副本或时间开关，且自动生成开启，则自动生成标题
      if (
        (field === "team_time" || field === "dungeon" || field === "no_specific_time") &&
        newData.auto_generate_title
      ) {
        newData.title = generateTitleFromData(newData);
      }

      return newData;
    });
  };

  // 根据数据自动生成标题
  const generateTitleFromData = (data) => {
    const parts = [];

    if (data.team_time && !data.no_specific_time) {
      const { year, month, day, hour, minute } = data.team_time;

      // 计算星期几
      const date = new Date(year, month - 1, day);
      const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
      const weekday = weekdays[date.getDay()];

      const monthStr = String(month).padStart(2, "0");
      const dayStr = String(day).padStart(2, "0");
      const hourStr = String(hour).padStart(2, "0");
      const minuteStr = String(minute).padStart(2, "0");

      parts.push(`${monthStr}月${dayStr}日(${weekday}) ${hourStr}:${minuteStr}`);
    }

    if (data.dungeon) {
      parts.push(data.dungeon);
    }

    return parts.join(" ");
  };

  // 切换自动生成标题
  const toggleAutoGenerate = () => {
    const newAutoGenerate = !formData.auto_generate_title;
    setFormData((prev) => {
      const newData = { ...prev, auto_generate_title: newAutoGenerate };

      // 如果开启自动生成，立即生成标题
      if (newAutoGenerate && !prev.no_specific_time) {
        const generatedTitle = generateTitleFromData(prev);
        if (generatedTitle) {
          newData.title = generatedTitle;
        }
      }

      return newData;
    });
  };

  // 设置预设时间
  const setPresetTime = (hour, minute, label) => {
    const newTime = getTodayTime(hour, minute);
    setFormData((prev) => {
      const newData = {
        ...prev,
        team_time: newTime,
        no_specific_time: false,
      };

      // 如果开启了自动生成标题，则自动更新标题
      if (prev.auto_generate_title) {
        newData.title = generateTitleFromData(newData);
      }

      return newData;
    });
  };

  // 提交表单
  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      showToast.error("请输入开团标题");
      return;
    }

    if (formData.title.length > 30) {
      showToast.error("开团标题不能超过30个字");
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

    if (formData.notice.length > 2000) {
      showToast.error("团队告示不能超过2000个字");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        title: formData.title.trim(),
        team_time: formData.no_specific_time ? null : calendarDateTimeToISO(formData.team_time),
        dungeon: formData.dungeon,
        max_members: 25, // 默认25人团
        is_xuanjing_booked: formData.is_xuanjing_booked,
        is_yuntie_booked: formData.is_yuntie_booked,
        is_hidden: formData.is_hidden,
        is_locked: formData.is_locked,
        notice: formData.notice.trim(),
        rules: boardRules, // 包含团队面板规则
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

  // 应用模板：用模板的 notice 与 rules 覆盖当前表单的告示与面板规则
  const handleApplyTemplate = () => {
    if (!formData.selected_template) {
      showToast.error("请先选择一个模板");
      return;
    }
    const tpl = templates.find((t) => String(t.id) === String(formData.selected_template));
    if (!tpl) {
      showToast.error("模板不存在或已被删除");
      return;
    }
    updateField("notice", tpl.notice || "");
    setBoardRules(Array.isArray(tpl.rules) && tpl.rules.length ? tpl.rules : buildEmptyRules());
    showToast.success("已应用模板");
  };

  // 保存为模板：将当前 notice 与 boardRules 保存为新模板
  const handleSaveAsTemplate = async () => {
    if (!guildId) return;
    try {
      setTplLoading(true);
      const payload = {
        title: formData.title?.trim() || null,
        notice: formData.notice || "",
        rules: boardRules || [],
      };
      await createTemplate(guildId, payload);
      showToast.success("已保存为模板");
      // 刷新模板列表
      const resp = await getTemplateList(guildId);
      setTemplates(resp.data || []);
    } catch (e) {
      showToast.error(e || "保存模板失败");
    } finally {
      setTplLoading(false);
    }
  };

  return (
    <div className="flex gap-4 h-full">
      {/* 主编辑区域 */}
      <Card className="flex-1">
      <CardHeader className="flex items-center justify-between border-b border-pink-200 dark:border-pink-900">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
          {isEdit ? "编辑开团" : "创建开团"}
        </h2>
        <div className="flex items-center gap-2">
          <Button color="default" variant="light" onPress={onCancel} isDisabled={loading}>
            取消
          </Button>
          <Button
            color="primary"
            className="bg-gradient-to-r from-pink-500 to-purple-500"
            onPress={handleSubmit}
            isLoading={loading}
          >
            {isEdit ? "保存修改" : "创建开团"}
          </Button>
        </div>
      </CardHeader>

      <CardBody className="overflow-auto">
        <div className="space-y-6">
          {/* 第一行：开团标题 + 自动生成开关 */}
          <div className="flex items-end gap-3">
            <Input
              label="开团标题"
              placeholder="请输入开团标题"
              value={formData.title}
              onValueChange={(value) => updateField("title", value)}
              isRequired
              variant="flat"
              maxLength={30}
              isDisabled={formData.auto_generate_title}
              endContent={
                <span className="text-xs text-default-400 whitespace-nowrap">{formData.title.length}/30</span>
              }
              classNames={{
                label: "text-pink-600 dark:text-pink-400 font-semibold",
              }}
              className="flex-1"
            />
            <Button
              size="lg"
              color={formData.auto_generate_title ? "secondary" : "default"}
              variant={formData.auto_generate_title ? "solid" : "bordered"}
              onPress={toggleAutoGenerate}
              className="min-w-32 h-14"
            >
              {formData.auto_generate_title ? "✨ 自动标题(已开启)" : "当前为手动输入模式"}
            </Button>
          </div>

          <Divider />

          {/* 第二行：发车时间 + 选择副本 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <DatePicker
                label="发车时间"
                value={formData.no_specific_time ? null : formData.team_time}
                onChange={(value) => updateField("team_time", value)}
                isDisabled={formData.no_specific_time}
                isRequired={!formData.no_specific_time}
                granularity="minute"
                hourCycle={24}
                hideTimeZone
                showMonthAndYearPickers
                calendarProps={{
                  focusedValue: formData.team_time,
                  defaultFocusedValue: formData.team_time || getDefaultDateTime(),
                }}
                classNames={{
                  label: "text-pink-600 dark:text-pink-400 font-semibold",
                }}
              />
              {/* 快捷时间按钮 */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  color="primary"
                  variant="flat"
                  onPress={() => setPresetTime(19, 50, "今天第一车 19:50")}
                  isDisabled={formData.no_specific_time}
                  className="flex-1"
                >
                  🚗 第一车 19:50
                </Button>
                <Button
                  size="sm"
                  color="secondary"
                  variant="flat"
                  onPress={() => setPresetTime(22, 0, "今天第二车 22:00")}
                  isDisabled={formData.no_specific_time}
                  className="flex-1"
                >
                  🚙 第二车 22:00
                </Button>

                <Switch
                  size="sm"
                  isSelected={formData.no_specific_time}
                  onValueChange={(value) => {
                    updateField("no_specific_time", value);
                    if (value) {
                      updateField("team_time", null);
                    } else {
                      // 恢复默认时间
                      updateField("team_time", getDefaultDateTime());
                    }
                  }}
                >
                  <span className="text-sm text-default-600">不指定具体时间</span>
                </Switch>
              </div>
            </div>

            <Select
              label="选择副本"
              placeholder="请选择副本"
              selectedKeys={formData.dungeon ? [formData.dungeon] : []}
              onChange={(e) => updateField("dungeon", e.target.value)}
              isRequired
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
          </div>

          <Divider />

          {/* 第三行：铁标记设置 + 权限设置 */}
          <div className="grid grid-cols-2 gap-6">
            {/* 左侧：铁标记设置 */}
            <div>
              <h3 className="text-sm font-semibold text-pink-600 dark:text-pink-400 mb-3">大小铁标记设置</h3>
              <div className="flex flex-nowrap gap-1">
                <div className="p-4 rounded-lg bg-default-100 dark:bg-default-50 flex-1">
                  <Switch
                    isSelected={formData.is_xuanjing_booked}
                    onValueChange={(value) => updateField("is_xuanjing_booked", value)}
                  >
                    <span className="text-sm font-medium flex items-center gap-2">
                      <img src="/玄晶.png" alt="玄晶" className="w-5 h-5" />
                      玄晶{" "}
                      <span className="text-xs text-default-500">
                        {formData.is_xuanjing_booked ? "(大包)" : "(大拍)"}
                      </span>
                    </span>
                  </Switch>
                </div>
                <div className="p-4 rounded-lg bg-default-100 dark:bg-default-50 flex-1">
                  <Switch
                    isSelected={formData.is_yuntie_booked}
                    onValueChange={(value) => updateField("is_yuntie_booked", value)}
                  >
                    <span className="text-sm font-medium flex items-center gap-2">
                      <img src="/陨铁.png" alt="陨铁" className="w-5 h-5" />
                      陨铁{" "}
                      <span className="text-xs text-default-500">
                        {formData.is_yuntie_booked ? "(小包)" : "(小拍)"}
                      </span>
                    </span>
                  </Switch>
                </div>
              </div>
            </div>

            {/* 右侧：权限设置 */}
            <div>
              <h3 className="text-sm font-semibold text-pink-600 dark:text-pink-400 mb-3">权限设置</h3>
              <div className="flex flex-nowrap gap-1">
                <div className="p-4 rounded-lg bg-default-100 dark:bg-default-50 flex-1">
                  <Switch isSelected={formData.is_hidden} onValueChange={(value) => updateField("is_hidden", value)}>
                    <span className="text-sm font-medium">👁️ 仅管理员可见</span>
                  </Switch>
                </div>
                <div className="p-4 rounded-lg bg-default-100 dark:bg-default-50 flex-1">
                  <Switch isSelected={formData.is_locked} onValueChange={(value) => updateField("is_locked", value)}>
                    <span className="text-sm font-medium">🔒 锁定自由报名（排表模式）</span>
                  </Switch>
                </div>
              </div>
            </div>
          </div>

          <Divider />

          {/* 团队面板 模板 */}
          <div>
            <h3 className="text-sm font-semibold text-pink-600 dark:text-pink-400 mb-3">团队面板</h3>
            <div className="flex items-end gap-3">
              <Select
                label="使用模板"
                placeholder="请选择模板"
                selectedKeys={formData.selected_template ? [String(formData.selected_template)] : []}
                onChange={(e) => updateField("selected_template", e.target.value)}
                isDisabled={tplLoading}
                classNames={{
                  label: "text-pink-600 dark:text-pink-400 font-semibold",
                }}
                className="flex-1"
              >
                {templates.map((tpl) => (
                  <SelectItem key={tpl.id} value={String(tpl.id)}>
                    {tpl.title || `模板 #${tpl.id}`}
                  </SelectItem>
                ))}
              </Select>
              <Button size="lg" color="primary" variant="flat" onPress={handleApplyTemplate} isDisabled={tplLoading}>
                应用模板
              </Button>
              <Button size="lg" color="secondary" variant="flat" onPress={handleSaveAsTemplate} isDisabled={tplLoading}>
                保存为模板
              </Button>
            </div>
          </div>

          {/* 团队面板 告示 */}
          <div>
            <Textarea
              label="团队告示"
              placeholder="输入团队告示内容（可选）&#10;例如：&#10;- 准时集合，不要迟到&#10;- 自备食物和药品&#10;- 听从指挥"
              value={formData.notice}
              onValueChange={(value) => updateField("notice", value)}
              minRows={6}
              maxRows={12}
              maxLength={2000}
              description={`${formData.notice.length}/2000`}
              classNames={{
                label: "text-pink-600 dark:text-pink-400 font-semibold",
                description: "text-xs text-default-400",
              }}
            />
          </div>

          {/* 团队面板（规则编辑模式） */}
          <div>
            <TeamBoard
              rules={boardRules}
              signupList={[]}
              mode="edit-rule"
              onRuleChange={(slotIndex, nextRule) => {
                setBoardRules((prev) => {
                  const next = [...prev];
                  next[slotIndex] = { ...next[slotIndex], ...nextRule };
                  return next;
                });
              }}
            />
          </div>
        </div>
      </CardBody>
    </Card>

      {/* 右侧帮助提示 */}
      <div className="w-80 flex-shrink-0">
        <HelpPanel />
      </div>
    </div>
  );
}
