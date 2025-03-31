-- 使用PostgreSQL数据库
-- 创建数据库
-- CREATE DATABASE xiaoyang

-- 使用数据库
-- \c xiaoyang

BEGIN;

------ 用户表 ------
-- 创建用户表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,  -- 用户ID, 自增主键
    qq_number VARCHAR(20) NOT NULL UNIQUE,  -- QQ号
    password VARCHAR(255) NOT NULL,  -- 密码
    nickname VARCHAR(50) NOT NULL,  -- 昵称
    avatar VARCHAR(100),  -- 头像
    is_admin BOOLEAN DEFAULT FALSE,  -- 是否为管理员
    is_bot BOOLEAN DEFAULT FALSE,  -- 是否为机器人
    is_reset_password BOOLEAN DEFAULT FALSE  -- 是否需要重置密码
);

-- 添加用户表注释
COMMENT ON TABLE users IS '用户表';
COMMENT ON COLUMN users.id IS '用户ID';
COMMENT ON COLUMN users.qq_number IS 'QQ号';
COMMENT ON COLUMN users.password IS '密码的哈希值';
COMMENT ON COLUMN users.nickname IS '昵称';
COMMENT ON COLUMN users.avatar IS '头像';
COMMENT ON COLUMN users.is_admin IS '是否为管理员';
COMMENT ON COLUMN users.is_bot IS '是否为机器人';
COMMENT ON COLUMN users.is_reset_password IS '是否需要重置密码';

-- 创建用户表索引
CREATE INDEX idx_users_qq_number ON users(qq_number);

------ 角色表 ------
-- 创建角色表
CREATE TABLE characters (
    id SERIAL PRIMARY KEY,  -- 角色ID, 自增主键
    user_id INT NOT NULL,  -- 用户ID, 外键
    name VARCHAR(50) NOT NULL,  -- 角色名
    server VARCHAR(30) NOT NULL,  -- 角色所在服务器
    xinfa VARCHAR(20) NOT NULL,  -- 角色心法
    remark TEXT,  -- 角色备注
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE  -- 外键关联用户表, 级联删除
);

-- 添加角色表注释
COMMENT ON TABLE characters IS '角色表';
COMMENT ON COLUMN characters.id IS '角色ID';
COMMENT ON COLUMN characters.user_id IS '用户ID';
COMMENT ON COLUMN characters.name IS '角色名';
COMMENT ON COLUMN characters.server IS '角色所在服务器';
COMMENT ON COLUMN characters.xinfa IS '角色心法';
COMMENT ON COLUMN characters.remark IS '角色备注';

-- 创建角色表索引
CREATE INDEX idx_characters_user_id ON characters(user_id);

------ 群组表 ------
-- 创建群组表
CREATE TABLE guilds (
    id SERIAL PRIMARY KEY,  -- 群组ID, 自增主键
    guild_qq_number VARCHAR(20) NOT NULL UNIQUE,  -- 群号
    ukey VARCHAR(20) NOT NULL UNIQUE, -- 群组唯一标识
    name VARCHAR(50) NOT NULL,  -- 群组名
    server VARCHAR(30) NOT NULL,  -- 群组所在服务器
    avatar VARCHAR(100),  -- 群组头像
    expire_time TIMESTAMP,  -- 过期时间
    preferences JSONB  -- 群组偏好设置
);

-- 添加群组表注释
COMMENT ON TABLE guilds IS '群组表';
COMMENT ON COLUMN guilds.id IS '群组ID';
COMMENT ON COLUMN guilds.guild_qq_number IS '群号';
COMMENT ON COLUMN guilds.ukey IS '群组唯一标识';
COMMENT ON COLUMN guilds.name IS '群组名';
COMMENT ON COLUMN guilds.server IS '群组所在服务器';
COMMENT ON COLUMN guilds.avatar IS '群组头像';
COMMENT ON COLUMN guilds.expire_time IS '过期时间';
COMMENT ON COLUMN guilds.preferences IS '群组偏好设置';

-- 创建群组表索引
CREATE INDEX idx_guild_group_number ON guilds(guild_qq_number);
CREATE INDEX idx_guild_ukey ON guilds(ukey);

------ 群组成员关联表 ------
-- 创建群组成员表
CREATE TABLE guild_members (
    id SERIAL PRIMARY KEY,  -- 关联ID, 自增主键
    guild_id INT NOT NULL,  -- 群组ID, 外键
    member_id INT NOT NULL,  -- 成员ID, 外键
    role VARCHAR(20) NOT NULL,  -- 角色(群主、管理员、普通成员)
    group_nickname VARCHAR(50),  -- 群内昵称
    FOREIGN KEY (guild_id) REFERENCES guilds(id) ON DELETE CASCADE,  -- 外键关联群组表, 级联删除
    FOREIGN KEY (member_id) REFERENCES users(id) ON DELETE CASCADE  -- 外键关联用户表, 级联删除
);

-- 添加群组成员表注释
COMMENT ON TABLE guild_members IS '群组成员表';
COMMENT ON COLUMN guild_members.id IS '关联ID';
COMMENT ON COLUMN guild_members.guild_id IS '群组ID';
COMMENT ON COLUMN guild_members.member_id IS '成员ID';
COMMENT ON COLUMN guild_members.role IS '角色';
COMMENT ON COLUMN guild_members.group_nickname IS '群内昵称';

-- 创建群组成员表索引
CREATE INDEX idx_guild_members_guild_id ON guild_members(guild_id);
CREATE INDEX idx_guild_members_member_id ON guild_members(member_id);

------ 副本开团表 ------
-- 创建副本开团表
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,  -- 开团ID, 自增主键
    guild_id INT NOT NULL,  -- 群组ID, 外键
    creater_id INT NOT NULL,  -- 创建者ID, 外键
    title VARCHAR(100) NOT NULL,  -- 开团标题
    team_time TIMESTAMP NOT NULL,  -- 开团时间
    dungeons VARCHAR(50) NOT NULL,  -- 副本名称
    book_xuanjing BOOLEAN NOT NULL,  -- 是否有人预定玄晶
    book_yuntie BOOLEAN NOT NULL,  -- 是否有人预定陨铁
    is_hidden BOOLEAN NOT NULL,  -- 是否对外可见
    is_lock BOOLEAN NOT NULL,  -- 是否锁定
    rule JSONB NOT NULL,  -- 报名规则
    notice TEXT,  -- 团队告示
    summary JSONB,  -- 团队总结
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 更新时间
    close_time TIMESTAMP,  -- 关闭时间
    close_id INT,  -- 关闭者ID
    FOREIGN KEY (guild_id) REFERENCES guilds(id) ON DELETE CASCADE  -- 外键关联群组表, 级联删除
);

-- 添加副本开团表注释
COMMENT ON TABLE teams IS '副本开团表';
COMMENT ON COLUMN teams.id IS '开团ID';
COMMENT ON COLUMN teams.guild_id IS '群组ID';
COMMENT ON COLUMN teams.creater_id IS '创建者ID';
COMMENT ON COLUMN teams.title IS '开团标题';
COMMENT ON COLUMN teams.team_time IS '开团时间';
COMMENT ON COLUMN teams.dungeons IS '副本名称';
COMMENT ON COLUMN teams.book_xuanjing IS '是否有人预定玄晶';
COMMENT ON COLUMN teams.book_yuntie IS '是否有人预定陨铁';
COMMENT ON COLUMN teams.is_hidden IS '是否对外隐藏';
COMMENT ON COLUMN teams.is_lock IS '是否锁定';
COMMENT ON COLUMN teams.rule IS '报名规则';
COMMENT ON COLUMN teams.notice IS '团队告示';
COMMENT ON COLUMN teams.summary IS '团队总结';
COMMENT ON COLUMN teams.create_time IS '创建时间';
COMMENT ON COLUMN teams.update_time IS '更新时间';
COMMENT ON COLUMN teams.close_time IS '关闭时间';
COMMENT ON COLUMN teams.close_id IS '关闭者ID';

-- 创建副本开团表索引
CREATE INDEX idx_teams_guild_id ON teams(guild_id);

------ 开团模板表 ------
-- 创建开团模板表
CREATE TABLE team_templates (
    id SERIAL PRIMARY KEY,  -- 模板ID, 自增主键
    guild_id INT NOT NULL,  -- 群组ID, 外键
    creater_id INT NOT NULL,  -- 创建者ID, 外键
    title VARCHAR(100) NOT NULL,  -- 模板标题
    rule JSONB NOT NULL,  -- 报名规则
    notice TEXT,  -- 团队告示
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 更新时间
    FOREIGN KEY (guild_id) REFERENCES guilds(id) ON DELETE CASCADE  -- 外键关联群组表, 级联删除
);

-- 添加开团模板表注释
COMMENT ON TABLE team_templates IS '开团模板表';
COMMENT ON COLUMN team_templates.id IS '模板ID';
COMMENT ON COLUMN team_templates.guild_id IS '群组ID';
COMMENT ON COLUMN team_templates.creater_id IS '创建者ID';
COMMENT ON COLUMN team_templates.title IS '模板标题';
COMMENT ON COLUMN team_templates.rule IS '报名规则';
COMMENT ON COLUMN team_templates.notice IS '团队告示';
COMMENT ON COLUMN team_templates.create_time IS '创建时间';
COMMENT ON COLUMN team_templates.update_time IS '更新时间';

-- 创建开团模板表索引
CREATE INDEX idx_team_templates_guild_id ON team_templates(guild_id);


------ 副本报名表 ------
-- 创建副本报名表
CREATE TABLE signups (
    id SERIAL PRIMARY KEY,  -- 报名ID, 自增主键
    team_id INT NOT NULL,  -- 开团ID, 外键
    submit_user_id INT NOT NULL,  -- 提交者ID, 外键
    signup_user_id INT,  -- 报名者ID, 外键
    signup_character_id INT,  -- 报名角色ID, 外键
    signup_info JSONB,  -- 报名信息(补充信息)
    priority INT NOT NULL,  -- 优先级
    is_rich BOOLEAN NOT NULL,  -- 是否是老板
    is_proxy BOOLEAN NOT NULL,  -- 是否是代报名
    client_type VARCHAR(20),  -- 客户端类型
    lock_slot INT,  -- 锁定到固定位置
    is_dove BOOLEAN NOT NULL,  -- 是否鸽了
    detail JSONB,  -- 报名详情, 未来拓展
    signup_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 报名时间
    cancel_user_id INT,  -- 取消者ID, 外键
    cancel_time TIMESTAMP,  -- 取消时间
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE  -- 外键关联开团表, 级联删除
);

-- 添加副本报名表注释
COMMENT ON TABLE signups IS '副本报名表';
COMMENT ON COLUMN signups.id IS '报名ID';
COMMENT ON COLUMN signups.team_id IS '开团ID';
COMMENT ON COLUMN signups.submit_user_id IS '提交者ID';
COMMENT ON COLUMN signups.signup_user_id IS '报名者ID';
COMMENT ON COLUMN signups.signup_character_id IS '报名角色ID';
COMMENT ON COLUMN signups.signup_info IS '报名信息';
COMMENT ON COLUMN signups.priority IS '优先级';
COMMENT ON COLUMN signups.is_rich IS '是否是老板';
COMMENT ON COLUMN signups.is_proxy IS '是否是代报名';
COMMENT ON COLUMN signups.client_type IS '客户端类型';
COMMENT ON COLUMN signups.lock_slot IS '锁定到固定位置';
COMMENT ON COLUMN signups.is_dove IS '是否鸽了';
COMMENT ON COLUMN signups.detail IS '报名详情';
COMMENT ON COLUMN signups.signup_time IS '报名时间';
COMMENT ON COLUMN signups.cancel_user_id IS '取消者ID';
COMMENT ON COLUMN signups.cancel_time IS '取消时间';

-- 创建副本报名表索引
CREATE INDEX idx_signups_team_id ON signups(team_id);
CREATE INDEX idx_signups_submit_user_id ON signups(submit_user_id);
CREATE INDEX idx_signups_cancel_user_id ON signups(cancel_user_id);
CREATE INDEX idx_signups_signup_user_id ON signups(signup_user_id);
CREATE INDEX idx_signups_signup_character_id ON signups(signup_character_id);

------ 操作日志表 ------
-- 创建操作日志表
CREATE TABLE logs (
    id SERIAL PRIMARY KEY,  -- 日志ID, 自增主键
    user_id INT NOT NULL,  -- 用户ID, 外键
    guild_id INT,  -- 群组ID, 外键
    action VARCHAR(50) NOT NULL,  -- 操作
    detail JSONB,  -- 详情
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- 创建时间
);

-- 添加操作日志表注释
COMMENT ON TABLE logs IS '操作日志表';
COMMENT ON COLUMN logs.id IS '日志ID';
COMMENT ON COLUMN logs.user_id IS '用户ID';
COMMENT ON COLUMN logs.guild_id IS '群组ID';
COMMENT ON COLUMN logs.action IS '操作';
COMMENT ON COLUMN logs.detail IS '详情';
COMMENT ON COLUMN logs.create_time IS '创建时间';

-- 创建操作日志表索引
CREATE INDEX idx_logs_user_id ON logs(user_id);
CREATE INDEX idx_logs_guild_id ON logs(guild_id);

COMMIT;