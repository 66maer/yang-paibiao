-- 使用PostgreSQL数据库
-- 创建数据库
-- CREATE DATABASE xiaoyang_paibiao;

-- 使用数据库
-- \c xiaoyang_paibiao;

BEGIN;

------ 用户表 ------
-- 创建用户表
CREATE TABLE users (
    uid SERIAL PRIMARY KEY,  -- 用户ID, 自增主键
    qq_number VARCHAR(20) NOT NULL UNIQUE,  -- QQ号
    password VARCHAR(255) NOT NULL,  -- 密码的哈希值
    nickname VARCHAR(50) NOT NULL,  -- 昵称
    avatar VARCHAR(100)  -- 头像
);

-- 添加用户表注释
COMMENT ON TABLE users IS '用户表';
COMMENT ON COLUMN users.uid IS '用户ID';
COMMENT ON COLUMN users.qq_number IS 'QQ号';
COMMENT ON COLUMN users.password IS '密码的哈希值';
COMMENT ON COLUMN users.nickname IS '昵称';
COMMENT ON COLUMN users.avatar IS '头像';

-- 创建用户表索引
CREATE INDEX idx_users_qq_number ON users(qq_number);

------ 角色表 ------
-- 创建角色表
CREATE TABLE characters (
    cid SERIAL PRIMARY KEY,  -- 角色ID, 自增主键
    uid INT NOT NULL,  -- 用户ID, 外键
    name VARCHAR(50) NOT NULL,  -- 角色名
    server VARCHAR(30) NOT NULL,  -- 角色所在服务器
    xinfa VARCHAR(20) NOT NULL,  -- 角色心法
    remark TEXT,  -- 角色备注
    FOREIGN KEY (uid) REFERENCES users(uid) ON DELETE CASCADE  -- 外键关联用户表, 级联删除
);

-- 添加角色表注释
COMMENT ON TABLE characters IS '角色表';
COMMENT ON COLUMN characters.cid IS '角色ID';
COMMENT ON COLUMN characters.uid IS '用户ID';
COMMENT ON COLUMN characters.name IS '角色名';
COMMENT ON COLUMN characters.server IS '角色所在服务器';
COMMENT ON COLUMN characters.xinfa IS '角色心法';
COMMENT ON COLUMN characters.remark IS '角色备注';

-- 创建角色表索引
CREATE INDEX idx_characters_uid ON characters(uid);

------ 群组表 ------
-- 创建群组表
CREATE TABLE leagues (
    gid SERIAL PRIMARY KEY,  -- 群组ID, 自增主键
    group_number VARCHAR(20) NOT NULL UNIQUE,  -- 群号
    ukey VARCHAR(20) NOT NULL, -- 群组唯一标识
    name VARCHAR(50) NOT NULL,  -- 群组名
    server VARCHAR(30) NOT NULL,  -- 群组所在服务器
    avatar VARCHAR(100),  -- 群组头像
    leader INT NOT NULL,  -- 群主ID, 外键
    preferences JSONB  -- 群组偏好设置
);

-- 添加群组表注释
COMMENT ON TABLE leagues IS '群组表';
COMMENT ON COLUMN leagues.gid IS '群组ID';
COMMENT ON COLUMN leagues.group_number IS '群号';
COMMENT ON COLUMN leagues.ukey IS '群组唯一标识';
COMMENT ON COLUMN leagues.name IS '群组名';
COMMENT ON COLUMN leagues.server IS '群组所在服务器';
COMMENT ON COLUMN leagues.avatar IS '群组头像';
COMMENT ON COLUMN leagues.leader IS '群主ID';
COMMENT ON COLUMN leagues.preferences IS '群组偏好设置';

-- 创建群组表索引
CREATE INDEX idx_leagues_group_number ON leagues(group_number);
CREATE INDEX idx_leagues_ukey ON leagues(ukey);


------ 群组成员关联表 ------
-- 创建群组成员表
CREATE TABLE league_members (
    gid INT NOT NULL,  -- 群组ID, 外键
    uid INT NOT NULL,  -- 用户ID, 外键
    PRIMARY KEY (gid, uid), -- 联合主键
    role VARCHAR(20) NOT NULL,  -- 角色(群主、管理员、普通成员)
    group_nickname VARCHAR(50),  -- 群内昵称
    FOREIGN KEY (gid) REFERENCES leagues(gid) ON DELETE CASCADE,  -- 外键关联群组表, 级联删除
    FOREIGN KEY (uid) REFERENCES users(uid) ON DELETE CASCADE  -- 外键关联用户表, 级联删除
);

-- 添加群组成员表注释
COMMENT ON TABLE league_members IS '群组成员表';
COMMENT ON COLUMN league_members.gid IS '群组ID';
COMMENT ON COLUMN league_members.uid IS '用户ID';
COMMENT ON COLUMN league_members.role IS '角色';
COMMENT ON COLUMN league_members.group_nickname IS '群内昵称';

-- 创建群组成员表索引
CREATE INDEX idx_league_members_gid ON league_members(gid);
CREATE INDEX idx_league_members_uid ON league_members(uid);

------ 副本开团表 ------
-- 创建副本开团表
CREATE TABLE teams (
    tid SERIAL PRIMARY KEY,  -- 开团ID, 自增主键
    gid INT NOT NULL,  -- 群组ID, 外键
    create_uid INT NOT NULL,  -- 创建者ID, 外键
    title VARCHAR(100) NOT NULL,  -- 开团标题
    team_time TIMESTAMP NOT NULL,  -- 开团时间
    dungeons VARCHAR(50) NOT NULL,  -- 副本名称
    book_xuanjing BOOLEAN NOT NULL,  -- 是否有人预定玄晶
    book_yuntie BOOLEAN NOT NULL,  -- 是否有人预定陨铁
    visible BOOLEAN NOT NULL,  -- 是否对外可见
    lock BOOLEAN NOT NULL,  -- 是否锁定
    rule JSONB NOT NULL,  -- 报名规则
    notice TEXT,  -- 团队告示
    closed BOOLEAN NOT NULL,  -- 是否已被关闭
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 更新时间
    close_time TIMESTAMP,  -- 关闭时间
    FOREIGN KEY (gid) REFERENCES leagues(gid) ON DELETE CASCADE  -- 外键关联群组表, 级联删除
);

-- 添加副本开团表注释
COMMENT ON TABLE teams IS '副本开团表';
COMMENT ON COLUMN teams.tid IS '开团ID';
COMMENT ON COLUMN teams.gid IS '群组ID';
COMMENT ON COLUMN teams.create_uid IS '创建者ID';
COMMENT ON COLUMN teams.title IS '开团标题';
COMMENT ON COLUMN teams.team_time IS '开团时间';
COMMENT ON COLUMN teams.dungeons IS '副本名称';
COMMENT ON COLUMN teams.book_xuanjing IS '是否有人预定玄晶';
COMMENT ON COLUMN teams.book_yuntie IS '是否有人预定陨铁';
COMMENT ON COLUMN teams.visible IS '是否对外可见';
COMMENT ON COLUMN teams.lock IS '是否锁定';
COMMENT ON COLUMN teams.rule IS '报名规则';
COMMENT ON COLUMN teams.notice IS '团队告示';
COMMENT ON COLUMN teams.closed IS '是否已被关闭';
COMMENT ON COLUMN teams.create_time IS '创建时间';
COMMENT ON COLUMN teams.update_time IS '更新时间';
COMMENT ON COLUMN teams.close_time IS '关闭时间';

-- 创建副本开团表索引
CREATE INDEX idx_teams_gid ON teams(gid);

------ 副本报名表 ------
-- 创建副本报名表
CREATE TABLE signups (
    sid SERIAL PRIMARY KEY,  -- 报名ID, 自增主键
    tid INT NOT NULL,  -- 开团ID, 外键
    submit_uid INT NOT NULL,  -- 提交者ID, 外键
    cancel_uid INT,  -- 取消者ID, 外键
    signup_uid INT,  -- 报名者ID, 外键
    signup_cid INT,  -- 报名者角色ID, 外键
    signup_info JSONB,  -- 报名信息(补充信息, 会优先使用uid和cid对应的信息)
    priority INT NOT NULL,  -- 优先级
    is_rich BOOLEAN NOT NULL,  -- 是否是老板
    is_proxy BOOLEAN NOT NULL,  -- 是否是代报名
    client_type VARCHAR(20),  -- 客户端类型
    lock_slot INT,  -- 锁定到固定位置
    is_dove BOOLEAN NOT NULL,  -- 是否鸽了
    detail JSONB,  -- 报名详情, 未来拓展
    signup_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 报名时间
    cancel_time TIMESTAMP,  -- 取消时间
    FOREIGN KEY (tid) REFERENCES teams(tid) ON DELETE CASCADE  -- 外键关联副本开团表, 级联删除
);

-- 添加副本报名表注释
COMMENT ON TABLE signups IS '副本报名表';
COMMENT ON COLUMN signups.sid IS '报名ID';
COMMENT ON COLUMN signups.tid IS '开团ID';
COMMENT ON COLUMN signups.submit_uid IS '提交者ID';
COMMENT ON COLUMN signups.cancel_uid IS '取消者ID';
COMMENT ON COLUMN signups.signup_uid IS '报名者ID';
COMMENT ON COLUMN signups.signup_cid IS '报名者角色ID';
COMMENT ON COLUMN signups.signup_info IS '报名信息';
COMMENT ON COLUMN signups.priority IS '优先级';
COMMENT ON COLUMN signups.is_rich IS '是否是老板';
COMMENT ON COLUMN signups.is_proxy IS '是否是代报名';
COMMENT ON COLUMN signups.client_type IS '客户端类型';
COMMENT ON COLUMN signups.lock_slot IS '锁定到固定位置';
COMMENT ON COLUMN signups.is_dove IS '是否鸽了';
COMMENT ON COLUMN signups.detail IS '报名详情';
COMMENT ON COLUMN signups.signup_time IS '报名时间';
COMMENT ON COLUMN signups.cancel_time IS '取消时间';

-- 创建副本报名表索引
CREATE INDEX idx_signups_tid ON signups(tid);
CREATE INDEX idx_signups_submit_uid ON signups(submit_uid);
CREATE INDEX idx_signups_cancel_uid ON signups(cancel_uid);
CREATE INDEX idx_signups_signup_uid ON signups(signup_uid);
CREATE INDEX idx_signups_signup_cid ON signups(signup_cid);

------ 操作日志表 ------
-- 创建操作日志表
CREATE TABLE logs (
    log_id SERIAL PRIMARY KEY,  -- 日志ID, 自增主键
    uid INT NOT NULL,  -- 用户ID, 外键
    gid INT,  -- 群组ID, 外键
    action VARCHAR(50) NOT NULL,  -- 操作
    detail JSONB,  -- 详情
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- 创建时间
);

-- 添加操作日志表注释
COMMENT ON TABLE logs IS '操作日志表';
COMMENT ON COLUMN logs.log_id IS '日志ID';
COMMENT ON COLUMN logs.uid IS '用户ID';
COMMENT ON COLUMN logs.gid IS '群组ID';
COMMENT ON COLUMN logs.action IS '操作';
COMMENT ON COLUMN logs.detail IS '详情';
COMMENT ON COLUMN logs.create_time IS '创建时间';

-- 创建操作日志表索引
CREATE INDEX idx_logs_uid ON logs(uid);
CREATE INDEX idx_logs_gid ON logs(gid);

COMMIT;