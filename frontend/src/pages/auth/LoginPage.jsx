import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { userLogin, getUserInfo } from "@/api/auth";
import useAuthStore from "@/stores/authStore";
import ThemeSwitch from "@/components/common/ThemeSwitch";

const showcasePosts = [
  {
    id: 1,
    category: "读书笔记",
    date: "2026-04-18",
    readTime: "3 分钟阅读",
    title: "重读《人间词话》：境界二字，落到生活里其实很轻",
    summary:
      '最近又翻了一遍《人间词话》，比起几年前第一次读，这次更在意的是王国维谈"境界"时那种很克制的语气，不刻意拔高，反而显得真诚。',
    detail:
      '几年前第一次读时只记住了"有我之境"和"无我之境"，这次重读发现很多段落都在谈"真"——感情真、景物真、说话真。落到日常里，大概就是写字的时候不端着、记录心情的时候不修饰。',
    likes: 12,
    comments: 3,
    saves: 5,
    hot: true,
  },
  {
    id: 2,
    category: "生活随笔",
    date: "2026-04-15",
    readTime: "5 分钟阅读",
    title: "周末去山里走了一圈，回来发现城市的声音变小了",
    summary:
      "周六一早临时决定去附近的山里走走，没带相机也没做攻略，就是单纯想离屏幕远一点。从山脚到半山腰大概走了两个多小时。",
    detail:
      "山里的空气有一种很扎实的湿润感，和城里不一样。下山以后回到家，反倒觉得平时听惯的车流声、空调外机声都柔和了不少。可能不是声音变了，是自己的耳朵被洗过了一次。",
    likes: 8,
    comments: 2,
    saves: 4,
    hot: false,
  },
  {
    id: 3,
    category: "学习随想",
    date: "2026-04-09",
    readTime: "4 分钟阅读",
    title: "学了一个月的水彩，最大的收获是学会了等水自己干",
    summary:
      "之前一直没耐心画水彩，总觉得颜色铺上去之后等待的时间太煎熬。这一个月慢慢摸索下来，反而觉得这段等待是水彩最有意思的地方。",
    detail:
      '水分多的时候颜色会自己流动，留白和晕染都不是"画"出来的，是"等"出来的。这种顺着材料的脾气走的感觉，和我平时写代码追求精确控制完全相反，但意外地让人放松。',
    likes: 6,
    comments: 1,
    saves: 3,
    hot: false,
  },
  {
    id: 4,
    category: "厨房日常",
    date: "2026-04-02",
    readTime: "2 分钟阅读",
    title: "试了第三次做溏心蛋，终于摸清楚了自家锅的脾气",
    summary:
      "网上的教程都说煮 6 分半，但我家锅小水少，前两次不是太老就是壳粘住。这次记下了几个细节，算是给自己留个备忘。",
    detail:
      "最后定下的方法：冷水下锅，沸腾后转中火 6 分钟，捞出来立刻泡冰水 3 分钟。蛋壳从大头开始剥更顺手。其实最关键的不是时间，是每次都用同一个锅、同一个炉头。",
    likes: 4,
    comments: 0,
    saves: 2,
    hot: false,
  },
];

const upcomingItems = [
  { date: "04/28", title: "把上周的水彩练习装订成册" },
  { date: "05/02", title: "读完《活着》并写一篇短笔记" },
  { date: "05/08", title: "整理三月以来的手机随手拍" },
  { date: "05/12", title: "试做一次自家版本的提拉米苏" },
  { date: "05/20", title: "把博客底部的版权信息再排一版" },
];

const showcaseTags = ["读书", "随笔", "水彩", "厨房", "散步", "摄影", "听歌", "胡思乱想"];

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

  .login-showcase-footer-link {
    color: var(--ink-soft);
    text-decoration: none;
    border-bottom: 1px dashed var(--line);
    transition: color 0.18s ease, border-color 0.18s ease;
  }

  .login-showcase-footer-link:hover {
    color: var(--primary);
    border-bottom-color: var(--primary);
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
            <div className="login-showcase-logo">小秧的小站</div>
            <ThemeSwitch className="login-showcase-theme-switch" />
          </header>

          <section className="login-showcase-hero">
            <h1>记录生活</h1>
          </section>

          <main className="login-showcase-main">
            <section>
              <div className="login-showcase-section-title">
                <h2>最近写的</h2>
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
                <h3 className="login-showcase-login-title">留言登录</h3>
                <p className="login-showcase-login-sub">登录后可以在文章下面留言，也方便我回复你。</p>

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
                    {loading ? "登录中..." : "登录留言"}
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
                <h3>最近想做的</h3>
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
          <p>
            小秧的小站 ©{new Date().getFullYear()} 丐箩箩 |{" "}
            <a
              href="https://beian.miit.gov.cn/"
              target="_blank"
              rel="noreferrer noopener"
              className="login-showcase-footer-link"
            >
              蜀ICP备2024079726号-1
            </a>
          </p>
        </footer>
      </div>
    </>
  );
}
