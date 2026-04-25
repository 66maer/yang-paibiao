import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { userLogin, getUserInfo } from "@/api/auth";
import useAuthStore from "@/stores/authStore";
import ThemeSwitch from "@/components/common/ThemeSwitch";

const showcasePosts = [
  {
    id: 1,
    category: "排表速览",
    date: "2026-04-18",
    readTime: "3 分钟阅读",
    title: "本周团本安排已经排到周四，缺口位置同步开放中",
    summary:
      "这一版展示页主要用来承接登录入口，顺手把最近的团本、活动和值班安排做成了可浏览的信息区，方便成员登录前先看个大概。",
    detail:
      "周一到周四的主团时间已经固定，治疗和补位职业还留了两个空档。为了不让登录页显得太空，这里用一段较完整的摘要模拟站内内容，点击左侧不同条目会切换这里的正文预览。",
    likes: 126,
    comments: 18,
    saves: 41,
    hot: true,
  },
  {
    id: 2,
    category: "活动记录",
    date: "2026-04-15",
    readTime: "5 分钟阅读",
    title: "清明活动复盘：报名节奏更稳后，临时补位明显减少",
    summary:
      "上周我们把报名确认时间从当天中午提前到了前一晚，实际执行下来效果不错，尤其是临时喊人补位的次数下降得很明显。",
    detail:
      "复盘里主要记录了三个点：报名提醒提前、替补名单前置、缺席说明统一入口。这个登录页不承载业务逻辑，所以这里只保留纯展示文字，但布局和阅读体验会贴近真正的内容页。",
    likes: 89,
    comments: 11,
    saves: 27,
    hot: false,
  },
  {
    id: 3,
    category: "版本备忘",
    date: "2026-04-09",
    readTime: "4 分钟阅读",
    title: "下个版本准备补的三个小能力：请假备注、替补提醒、导出优化",
    summary: "登录页之外，排表后台后续还会补几个比较实用的细节能力，先放在这里做一个轻量展示，也让页面看起来更完整。",
    detail:
      "请假备注会补充更明确的时间描述，替补提醒会把状态变化推前一层提示，导出会优先处理字段顺序和空数据兼容。这里的文字只是展示占位，不影响现有登录流程。",
    likes: 74,
    comments: 9,
    saves: 22,
    hot: false,
  },
  {
    id: 4,
    category: "站内随记",
    date: "2026-04-02",
    readTime: "2 分钟阅读",
    title: "把登录入口做成展示页之后，首页终于不再像一堵墙",
    summary:
      "原先登录页信息量太少，成员打开后除了输账号密码几乎看不到别的内容。这次改成展示型布局，至少能让页面先把气氛铺出来。",
    detail:
      "这类页面的核心不是交互多，而是信息排布得体、登录动作明确。左边展示近期内容，右边固定登录入口，再补一块当前阅读摘要，用户到这里就能很自然地完成后续操作。",
    likes: 58,
    comments: 6,
    saves: 15,
    hot: false,
  },
];

const upcomingItems = [
  { date: "04/28", title: "周常团本名单最终确认" },
  { date: "05/02", title: "五一活动班表二次调整" },
  { date: "05/08", title: "新成员分组规则展示稿更新" },
  { date: "05/12", title: "请假与替补提醒文案整理" },
  { date: "05/20", title: "五月排表节奏复盘" },
];

const showcaseTags = ["排表", "团本", "招募", "值班", "公告", "活动记录", "版本备忘", "临时通知"];

const showcaseStyles = `
  .login-showcase-page {
    --bg: #f7f1fb;
    --bg-soft: #efe6f7;
    --card: rgba(255, 250, 253, 0.88);
    --card-strong: #fffafd;
    --ink: #2a1f3d;
    --ink-soft: #665879;
    --ink-faint: #a091b0;
    --primary: #b46cff;
    --accent: #ec1f6a;
    --accent-soft: rgba(255, 214, 230, 0.72);
    --line: rgba(234, 216, 243, 0.9);
    --shadow: 0 24px 56px rgba(110, 60, 160, 0.14);
    --shadow-soft: 0 10px 26px rgba(110, 60, 160, 0.08);
    min-height: 100vh;
    background:
      radial-gradient(circle at top left, rgba(255, 255, 255, 0.66), transparent 28%),
      radial-gradient(circle at top right, rgba(255, 214, 230, 0.5), transparent 24%),
      linear-gradient(160deg, #faf3ff 0%, #f3e8fa 62%, #ffeaf3 100%);
    color: var(--ink);
  }

  .dark .login-showcase-page {
    --bg: #17131f;
    --bg-soft: #21192d;
    --card: rgba(32, 24, 44, 0.78);
    --card-strong: rgba(35, 26, 48, 0.94);
    --ink: #f3ecfb;
    --ink-soft: #c0b0d8;
    --ink-faint: #8f7ea9;
    --primary: #d88bff;
    --accent: #ff77aa;
    --accent-soft: rgba(255, 119, 170, 0.16);
    --line: rgba(111, 86, 146, 0.52);
    --shadow: 0 24px 56px rgba(0, 0, 0, 0.42);
    --shadow-soft: 0 10px 26px rgba(0, 0, 0, 0.28);
    background:
      radial-gradient(circle at top left, rgba(255, 255, 255, 0.06), transparent 22%),
      radial-gradient(circle at top right, rgba(255, 119, 170, 0.12), transparent 18%),
      linear-gradient(160deg, #17131f 0%, #130f1d 58%, #1b1322 100%);
  }

  .login-showcase-shell {
    max-width: 1180px;
    margin: 0 auto;
    padding: 0 28px 56px;
  }

  .login-showcase-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24px 0 18px;
  }

  .login-showcase-logo {
    font-size: 24px;
    font-weight: 700;
    letter-spacing: 0.12em;
    background: linear-gradient(90deg, var(--primary), var(--accent));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .login-showcase-hero {
    padding: 10px 0 4px;
  }

  .login-showcase-kicker {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 7px 14px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.46);
    color: var(--ink-soft);
    font-size: 12px;
    border: 1px solid rgba(255, 255, 255, 0.42);
    box-shadow: var(--shadow-soft);
    backdrop-filter: blur(12px);
  }

  .dark .login-showcase-kicker {
    background: rgba(42, 32, 56, 0.72);
    border-color: rgba(111, 86, 146, 0.35);
  }

  .login-showcase-hero h1 {
    margin: 18px 0 12px;
    font-size: clamp(2rem, 4vw, 3.35rem);
    line-height: 1.18;
    letter-spacing: 0.02em;
  }

  .login-showcase-hero h1 span {
    background: linear-gradient(90deg, var(--primary), var(--accent));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .login-showcase-hero p {
    max-width: 720px;
    margin: 0;
    color: var(--ink-soft);
    font-size: 15px;
    line-height: 1.8;
  }

  .login-showcase-main {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 380px;
    gap: 34px;
    padding-top: 34px;
    align-items: start;
  }

  .login-showcase-section-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 16px;
  }

  .login-showcase-section-title h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    letter-spacing: 0.06em;
  }

  .login-showcase-section-title h2::before {
    content: "";
    display: inline-block;
    width: 4px;
    height: 16px;
    margin-right: 10px;
    border-radius: 999px;
    background: linear-gradient(180deg, var(--primary), var(--accent));
    vertical-align: -2px;
  }

  .login-showcase-section-note {
    font-size: 13px;
    color: var(--ink-faint);
  }

  .login-showcase-posts {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .login-showcase-post {
    width: 100%;
    border: 1px solid transparent;
    border-radius: 18px;
    background: var(--card);
    padding: 20px 22px;
    text-align: left;
    color: inherit;
    cursor: pointer;
    transition: transform 0.18s ease, box-shadow 0.22s ease, border-color 0.22s ease;
    box-shadow: var(--shadow-soft);
    backdrop-filter: blur(18px);
  }

  .login-showcase-post:hover,
  .login-showcase-post:focus-visible,
  .login-showcase-post.is-active {
    transform: translateY(-2px);
    border-color: var(--line);
    box-shadow: var(--shadow);
    outline: none;
  }

  .login-showcase-post.is-active {
    background: linear-gradient(180deg, var(--card-strong), rgba(255, 255, 255, 0.7));
  }

  .dark .login-showcase-post.is-active {
    background: linear-gradient(180deg, rgba(51, 39, 69, 0.96), rgba(32, 24, 44, 0.88));
  }

  .login-showcase-post-meta,
  .login-showcase-post-foot {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    font-size: 12px;
    color: var(--ink-faint);
  }

  .login-showcase-tag {
    padding: 4px 10px;
    border-radius: 999px;
    background: var(--bg-soft);
    color: var(--primary);
  }

  .login-showcase-tag.is-hot {
    background: var(--accent-soft);
    color: var(--accent);
  }

  .login-showcase-post h3 {
    margin: 12px 0 8px;
    font-size: 19px;
    line-height: 1.5;
  }

  .login-showcase-post p {
    margin: 0;
    font-size: 14px;
    color: var(--ink-soft);
    line-height: 1.8;
  }

  .login-showcase-post-foot {
    margin-top: 14px;
  }

  .login-showcase-side {
    display: flex;
    flex-direction: column;
    gap: 22px;
    position: sticky;
    top: 20px;
  }

  .login-showcase-login-card,
  .login-showcase-card {
    border-radius: 20px;
    background: var(--card);
    padding: 24px;
    box-shadow: var(--shadow-soft);
    border: 1px solid rgba(255, 255, 255, 0.22);
    backdrop-filter: blur(18px);
  }

  .login-showcase-login-card {
    box-shadow: var(--shadow);
  }

  .dark .login-showcase-login-card,
  .dark .login-showcase-card {
    border-color: rgba(111, 86, 146, 0.22);
  }

  .login-showcase-login-title,
  .login-showcase-card h3 {
    margin: 0;
    font-size: 17px;
    font-weight: 600;
  }

  .login-showcase-login-sub {
    margin: 6px 0 0;
    font-size: 13px;
    color: var(--ink-faint);
    line-height: 1.7;
  }

  .login-showcase-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 18px;
  }

  .login-showcase-field {
    display: block;
    border: 1.5px solid var(--line);
    border-radius: 14px;
    padding: 10px 14px 12px;
    background: rgba(255, 255, 255, 0.58);
    transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
  }

  .dark .login-showcase-field {
    background: rgba(25, 19, 35, 0.62);
  }

  .login-showcase-field:focus-within {
    border-color: var(--primary);
    box-shadow: 0 0 0 4px rgba(180, 108, 255, 0.14);
  }

  .login-showcase-field span {
    display: block;
    margin-bottom: 4px;
    font-size: 11px;
    color: var(--ink-soft);
  }

  .login-showcase-field span::after {
    content: " *";
    color: var(--accent);
  }

  .login-showcase-field input {
    width: 100%;
    padding: 0;
    border: none;
    outline: none;
    font: inherit;
    color: var(--ink);
    background: transparent;
  }

  .login-showcase-field input::placeholder {
    color: var(--ink-faint);
  }

  .login-showcase-error {
    border-radius: 12px;
    padding: 12px 14px;
    font-size: 13px;
    line-height: 1.6;
    color: #b01952;
    background: rgba(255, 214, 230, 0.72);
  }

  .dark .login-showcase-error {
    color: #ffc2d6;
    background: rgba(176, 25, 82, 0.18);
  }

  .login-showcase-submit,
  .login-showcase-chip {
    font: inherit;
  }

  .login-showcase-submit {
    width: 100%;
    border: none;
    border-radius: 14px;
    padding: 13px 18px;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.28em;
    color: #ffffff;
    background: linear-gradient(90deg, var(--accent), #ff5b9b);
    box-shadow: 0 10px 22px rgba(236, 31, 106, 0.28);
    cursor: pointer;
    transition: transform 0.16s ease, box-shadow 0.18s ease, opacity 0.18s ease;
  }

  .login-showcase-submit:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 14px 26px rgba(236, 31, 106, 0.34);
  }

  .login-showcase-submit:disabled {
    opacity: 0.76;
    cursor: not-allowed;
  }

  .login-showcase-hint {
    margin-top: 12px;
    font-size: 12px;
    color: var(--ink-faint);
    text-align: center;
    line-height: 1.7;
  }

  .login-showcase-feature-category {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    margin-top: 14px;
    border-radius: 999px;
    background: var(--bg-soft);
    color: var(--primary);
    font-size: 12px;
  }

  .login-showcase-feature-title {
    margin: 12px 0 10px;
    font-size: 18px;
    line-height: 1.6;
  }

  .login-showcase-feature-copy,
  .login-showcase-card p {
    margin: 0;
    font-size: 14px;
    line-height: 1.8;
    color: var(--ink-soft);
  }

  .login-showcase-schedule {
    margin: 14px 0 0;
    padding: 0;
    list-style: none;
  }

  .login-showcase-schedule li {
    display: flex;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px dashed var(--line);
    font-size: 13px;
  }

  .login-showcase-schedule li:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .login-showcase-schedule-date {
    min-width: 56px;
    color: var(--primary);
    font-weight: 600;
  }

  .login-showcase-schedule-text {
    color: var(--ink-soft);
  }

  .login-showcase-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 9px;
    margin-top: 14px;
  }

  .login-showcase-chip {
    border: none;
    border-radius: 999px;
    padding: 7px 12px;
    background: var(--bg-soft);
    color: var(--ink-soft);
    cursor: default;
    transition: transform 0.18s ease, background 0.18s ease, color 0.18s ease;
  }

  .login-showcase-chip:hover {
    transform: translateY(-1px);
    background: var(--primary);
    color: #ffffff;
  }

  .login-showcase-footer {
    border-top: 1px solid var(--line);
    padding: 20px 28px 28px;
    background: rgba(255, 255, 255, 0.34);
    text-align: center;
    color: var(--ink-faint);
    font-size: 12px;
    backdrop-filter: blur(10px);
  }

  .dark .login-showcase-footer {
    background: rgba(23, 19, 31, 0.46);
  }

  .login-showcase-footer p {
    margin: 0;
  }

  @media (max-width: 1024px) {
    .login-showcase-main {
      grid-template-columns: 1fr;
    }

    .login-showcase-side {
      position: static;
    }
  }

  @media (max-width: 640px) {
    .login-showcase-shell {
      padding: 0 18px 36px;
    }

    .login-showcase-nav {
      padding-top: 18px;
    }

    .login-showcase-hero h1 {
      font-size: 2rem;
    }

    .login-showcase-post,
    .login-showcase-login-card,
    .login-showcase-card {
      padding: 18px;
      border-radius: 16px;
    }

    .login-showcase-footer {
      padding-left: 18px;
      padding-right: 18px;
    }
  }
`;

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth, setCurrentGuild } = useAuthStore();

  const [formData, setFormData] = useState({
    qq_number: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activePostId, setActivePostId] = useState(showcasePosts[0].id);

  const activePost = showcasePosts.find((post) => post.id === activePostId) || showcasePosts[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await userLogin(formData.qq_number, formData.password);

      // 检查响应数据结构
      const tokenData = response.data || response;
      const accessToken = tokenData.access_token;
      const refreshToken = tokenData.refresh_token;

      if (!accessToken) {
        throw new Error("登录失败：未获取到访问令牌");
      }

      // 先保存token到store，这样后续请求才能携带token
      setAuth(accessToken, refreshToken, null);

      // 获取用户信息和群组列表
      const [userInfo, guildsInfo] = await Promise.all([
        getUserInfo(),
        import("@/api/user").then((m) => m.getUserGuilds()),
      ]);

      const userData = userInfo.data;
      // 将群组数据添加到用户信息中
      userData.guilds = guildsInfo.data || [];

      // 更新用户信息到全局状态
      setAuth(accessToken, refreshToken, userData);

      // 登录后优化跳转逻辑
      const guilds = Array.isArray(userData?.guilds) ? userData.guilds : [];
      const localSelectedRaw = localStorage.getItem("selectedGuildId");
      const localSelectedId = localSelectedRaw ? parseInt(localSelectedRaw, 10) : null;
      const hasLocalValid = !!(localSelectedId && guilds.some((g) => g.id === localSelectedId));

      if (hasLocalValid) {
        // 本地存在合法选择：直接设置并跳转
        setCurrentGuild(localSelectedId);
        navigate("/board", { replace: true });
        return;
      }

      if (guilds.length === 1) {
        // 只有一个群组：自动选择并跳转
        const onlyId = guilds[0].id;
        setCurrentGuild(onlyId);
        localStorage.setItem("selectedGuildId", String(onlyId));
        navigate("/board", { replace: true });
        return;
      }

      // 多个群组且本地无有效选择：进入中转页
      navigate("/guilds", { replace: true });
    } catch (err) {
      console.error("登录错误:", err);
      setError(typeof err === "string" ? err : err.message || "登录失败，请检查QQ号和密码");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{showcaseStyles}</style>
      <div className="login-showcase-page">
        <div className="login-showcase-shell">
          <header className="login-showcase-nav">
            <div className="login-showcase-logo">小秧</div>
            <ThemeSwitch className="login-showcase-theme-switch" />
          </header>

          <section className="login-showcase-hero">
            <h1>分享近期安排与心得</h1>
          </section>

          <main className="login-showcase-main">
            <section>
              <div className="login-showcase-section-title">
                <h2>最新动态</h2>
                <span className="login-showcase-section-note">点击卡片可切换右侧摘要</span>
              </div>

              <div className="login-showcase-posts">
                {showcasePosts.map((post) => (
                  <button
                    key={post.id}
                    type="button"
                    className={`login-showcase-post ${activePostId === post.id ? "is-active" : ""}`}
                    onClick={() => setActivePostId(post.id)}
                  >
                    <div className="login-showcase-post-meta">
                      <span className={`login-showcase-tag ${post.hot ? "is-hot" : ""}`}>{post.category}</span>
                      <span>{post.date}</span>
                      <span>{post.readTime}</span>
                    </div>
                    <h3>{post.title}</h3>
                    <p>{post.summary}</p>
                    <div className="login-showcase-post-foot">
                      <span>喜欢 {post.likes}</span>
                      <span>评论 {post.comments}</span>
                      <span>收藏 {post.saves}</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <aside className="login-showcase-side">
              <section className="login-showcase-login-card">
                <h3 className="login-showcase-login-title">老朋友登录</h3>

                <form className="login-showcase-form" onSubmit={handleSubmit} autoComplete="off">
                  <label className="login-showcase-field" htmlFor="login-qq-number">
                    <span>QQ 号</span>
                    <input
                      id="login-qq-number"
                      name="qq_number"
                      type="text"
                      value={formData.qq_number}
                      onChange={(e) => setFormData({ ...formData, qq_number: e.target.value })}
                      placeholder="请输入 QQ 号"
                      autoComplete="username"
                      required
                      autoFocus
                    />
                  </label>

                  <label className="login-showcase-field" htmlFor="login-password">
                    <span>密码</span>
                    <input
                      id="login-password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="请输入密码"
                      autoComplete="current-password"
                      required
                    />
                  </label>

                  {error ? <div className="login-showcase-error">{error}</div> : null}

                  <button type="submit" className="login-showcase-submit" disabled={loading}>
                    {loading ? "登录中..." : "登 录"}
                  </button>
                </form>
              </section>

              <section className="login-showcase-card">
                <h3>当前阅读</h3>
                <div className="login-showcase-feature-category">{activePost.category}</div>
                <h4 className="login-showcase-feature-title">{activePost.title}</h4>
                <p className="login-showcase-feature-copy">{activePost.detail}</p>
              </section>

              <section className="login-showcase-card">
                <h3>近期安排</h3>
                <ul className="login-showcase-schedule">
                  {upcomingItems.map((item) => (
                    <li key={`${item.date}-${item.title}`}>
                      <span className="login-showcase-schedule-date">{item.date}</span>
                      <span className="login-showcase-schedule-text">{item.title}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="login-showcase-card">
                <h3>常用标签</h3>
                <div className="login-showcase-tags">
                  {showcaseTags.map((tag) => (
                    <button key={tag} type="button" className="login-showcase-chip">
                      {tag}
                    </button>
                  ))}
                </div>
              </section>
            </aside>
          </main>
        </div>

        <footer className="login-showcase-footer">
          <p>小秧排表 ©{new Date().getFullYear()} 丐箩箩 | 蜀ICP备2024079726号-1</p>
        </footer>
      </div>
    </>
  );
}
