import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, CardHeader, Button, Chip } from "@heroui/react";
import toast from "react-hot-toast";
import useAuthStore from "../../stores/authStore";

/**
 * 群组中转页：登录后的初始页/切换群组页
 * 展示用户加入的群组为卡片，支持点击切换并跳转到面板页。
 */
export default function GuildHubPage() {
  const navigate = useNavigate();
  const { user, setCurrentGuild } = useAuthStore();
  const [loadingGuildId, setLoadingGuildId] = useState(null);

  const guilds = useMemo(() => user?.guilds || [], [user]);
  const currentGuildId = user?.current_guild_id ?? null;

  const getRoleColor = (role) => {
    switch (role) {
      case "owner":
        return "warning";
      case "helper":
        return "primary";
      case "member":
        return "success";
      default:
        return "default";
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case "owner":
        return "群主";
      case "helper":
        return "管理员";
      case "member":
        return "群员";
      default:
        return "未知";
    }
  };

  const doSwitchGuild = (guildId) => {
    if (!guildId) return;
    
    try {
      setLoadingGuildId(guildId);
      // 更新前端状态
      setCurrentGuild(guildId);
      localStorage.setItem("selectedGuildId", String(guildId));
      
      const newGuild = guilds.find((g) => g.id === guildId);
      toast.success(`已切换到 ${newGuild?.name || "群组"}`);
      
      navigate("/user/board", { replace: true });
    } catch (error) {
      toast.error("切换群组失败");
      setLoadingGuildId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
          选择你的群组
        </h1>
        <p className="text-sm text-default-500 mt-1">点击卡片进入或切换到对应群组</p>
      </div>

      {guilds.length === 0 ? (
        <Card className="bg-white/60 dark:bg-gray-800/60">
          <CardBody>
            <div className="text-center py-8">
              <p className="text-default-600">当前账号还未加入任何群组</p>
              <p className="text-default-400 text-sm mt-2">请联系管理员或群主邀请加入</p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {guilds.map((guild) => (
            <Card
              key={guild.id}
              isHoverable
              className={`border ${
                guild.id === currentGuildId
                  ? "border-pink-300 dark:border-pink-700"
                  : "border-transparent"
              } bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl`}
            >
              <CardHeader className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-semibold text-pink-600 dark:text-pink-400">
                    {guild.name}
                  </span>
                  <span className="text-xs text-default-500">{guild.guild_nickname}</span>
                </div>
                <Chip size="sm" variant="flat" color={getRoleColor(guild.role)}>
                  {getRoleLabel(guild.role)}
                </Chip>
              </CardHeader>
              <CardBody className="flex flex-col gap-3">
                <div className="text-xs text-default-500">
                  <div>服务器：{guild.server_name || "--"}</div>
                  <div>群人数：{guild.member_count ?? "--"}</div>
                </div>
                <Button
                  color={guild.id === currentGuildId ? "primary" : "default"}
                  variant={guild.id === currentGuildId ? "flat" : "bordered"}
                  isLoading={loadingGuildId === guild.id}
                  onPress={() => doSwitchGuild(guild.id)}
                >
                  {guild.id === currentGuildId ? "进入当前群组" : "切换并进入"}
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
