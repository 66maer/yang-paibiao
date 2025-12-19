-- =============================================
-- 小秧排坊 - 数据库设计 v2.0
-- 数据库: PostgreSQL 14+
-- 描述: 剑网3副本团队管理系统
-- =============================================

BEGIN;

-- =============================================
-- 系统管理层
-- =============================================

-- 系统管理员表
CREATE TABLE system_admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE system_admins IS '系统管理员表';
COMMENT ON COLUMN system_admins.id IS '管理员ID';
COMMENT ON COLUMN system_admins.username IS '用户名';
COMMENT ON COLUMN system_admins.password_hash IS '密码哈希值';
COMMENT ON COLUMN system_admins.last_login_at IS '最后登录时间';
COMMENT ON COLUMN system_admins.created_at IS '创建时间';
COMMENT ON COLUMN system_admins.updated_at IS '更新时间';

CREATE INDEX idx_system_admins_username ON system_admins(username);

-- 群组订阅/权限表
CREATE TABLE guild_subscriptions (
    id SERIAL PRIMARY KEY,
    guild_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    features JSONB, -- 功能权限配置
    notes TEXT, -- 备注
    created_by INT REFERENCES system_admins(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE guild_subscriptions IS '群组订阅权限表';
COMMENT ON COLUMN guild_subscriptions.id IS '订阅ID';
COMMENT ON COLUMN guild_subscriptions.guild_id IS '群组ID';
COMMENT ON COLUMN guild_subscriptions.start_date IS '开始日期';
COMMENT ON COLUMN guild_subscriptions.end_date IS '结束日期';
COMMENT ON COLUMN guild_subscriptions.features IS '功能权限配置';
COMMENT ON COLUMN guild_subscriptions.notes IS '备注';
COMMENT ON COLUMN guild_subscriptions.created_by IS '创建者';
COMMENT ON COLUMN guild_subscriptions.created_at IS '创建时间';
COMMENT ON COLUMN guild_subscriptions.updated_at IS '更新时间';

CREATE INDEX idx_guild_subscriptions_guild_id ON guild_subscriptions(guild_id);
CREATE INDEX idx_guild_subscriptions_end_date ON guild_subscriptions(end_date);

-- =============================================
-- 业务层 - 用户与群组
-- =============================================

-- 用户表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    qq_number VARCHAR(20) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    other_nicknames TEXT[], -- 其他昵称（用于搜索）
    avatar VARCHAR(255),
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP -- 软删除
);

COMMENT ON TABLE users IS '用户表';
COMMENT ON COLUMN users.id IS '用户ID';
COMMENT ON COLUMN users.qq_number IS 'QQ号';
COMMENT ON COLUMN users.password_hash IS '密码哈希值';
COMMENT ON COLUMN users.nickname IS '昵称';
COMMENT ON COLUMN users.other_nicknames IS '其他昵称（用于搜索）';
COMMENT ON COLUMN users.avatar IS '头像URL';
COMMENT ON COLUMN users.last_login_at IS '最后登录时间';
COMMENT ON COLUMN users.created_at IS '创建时间';
COMMENT ON COLUMN users.updated_at IS '更新时间';
COMMENT ON COLUMN users.deleted_at IS '删除时间（软删除）';

CREATE INDEX idx_users_qq_number ON users(qq_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
CREATE INDEX idx_users_other_nicknames ON users USING GIN (other_nicknames); -- GIN索引用于数组搜索

-- 角色表（角色和玩家是多对多关系）
CREATE TABLE characters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    server VARCHAR(30) NOT NULL,
    xinfa VARCHAR(20) NOT NULL,
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    UNIQUE(name, server) -- 同一服务器角色名唯一
);

COMMENT ON TABLE characters IS '角色表';
COMMENT ON COLUMN characters.id IS '角色ID';
COMMENT ON COLUMN characters.name IS '角色名';
COMMENT ON COLUMN characters.server IS '服务器';
COMMENT ON COLUMN characters.xinfa IS '心法';
COMMENT ON COLUMN characters.remark IS '备注';
COMMENT ON COLUMN characters.created_at IS '创建时间';
COMMENT ON COLUMN characters.updated_at IS '更新时间';
COMMENT ON COLUMN characters.deleted_at IS '删除时间';

CREATE INDEX idx_characters_name ON characters(name) WHERE deleted_at IS NULL;
CREATE INDEX idx_characters_server ON characters(server) WHERE deleted_at IS NULL;

-- 角色-玩家关联表（多对多）
CREATE TABLE character_players (
    id SERIAL PRIMARY KEY,
    character_id INT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    relation_type VARCHAR(20) NOT NULL DEFAULT 'owner', -- 关系类型: owner(主人), shared(共享)
    priority INT NOT NULL DEFAULT 0, -- 优先级，数值越小优先级越高
    notes TEXT, -- 备注
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(character_id, user_id)
);

COMMENT ON TABLE character_players IS '角色-玩家关联表';
COMMENT ON COLUMN character_players.id IS '关联ID';
COMMENT ON COLUMN character_players.character_id IS '角色ID';
COMMENT ON COLUMN character_players.user_id IS '用户ID';
COMMENT ON COLUMN character_players.relation_type IS '关系类型: owner(主人), shared(共享)';
COMMENT ON COLUMN character_players.priority IS '优先级，数值越小优先级越高';
COMMENT ON COLUMN character_players.notes IS '备注';
COMMENT ON COLUMN character_players.created_at IS '创建时间';
COMMENT ON COLUMN character_players.updated_at IS '更新时间';

CREATE INDEX idx_character_players_character_id ON character_players(character_id);
CREATE INDEX idx_character_players_user_id ON character_players(user_id);
CREATE INDEX idx_character_players_relation_type ON character_players(relation_type);
CREATE INDEX idx_character_players_is_primary ON character_players(is_primary);

-- 群组表
CREATE TABLE guilds (
    id SERIAL PRIMARY KEY,
    guild_qq_number VARCHAR(20) NOT NULL UNIQUE,
    ukey VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    server VARCHAR(30) NOT NULL,
    avatar VARCHAR(255),
    description TEXT,
    owner_id INT REFERENCES users(id), -- 群主
    preferences JSONB, -- 群组偏好设置
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

COMMENT ON TABLE guilds IS '群组表';
COMMENT ON COLUMN guilds.id IS '群组ID';
COMMENT ON COLUMN guilds.guild_qq_number IS '群号';
COMMENT ON COLUMN guilds.ukey IS '群组唯一标识';
COMMENT ON COLUMN guilds.name IS '群组名';
COMMENT ON COLUMN guilds.server IS '服务器';
COMMENT ON COLUMN guilds.avatar IS '头像URL';
COMMENT ON COLUMN guilds.description IS '群组描述';
COMMENT ON COLUMN guilds.owner_id IS '群主ID';
COMMENT ON COLUMN guilds.preferences IS '偏好设置';
COMMENT ON COLUMN guilds.created_at IS '创建时间';
COMMENT ON COLUMN guilds.updated_at IS '更新时间';
COMMENT ON COLUMN guilds.deleted_at IS '删除时间';

CREATE INDEX idx_guilds_guild_qq_number ON guilds(guild_qq_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_guilds_ukey ON guilds(ukey) WHERE deleted_at IS NULL;
CREATE INDEX idx_guilds_owner_id ON guilds(owner_id) WHERE deleted_at IS NULL;

-- 群组成员关联表
CREATE TABLE guild_members (
    id SERIAL PRIMARY KEY,
    guild_id INT NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- 角色: owner, admin, member
    group_nickname VARCHAR(50),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(guild_id, user_id)
);

COMMENT ON TABLE guild_members IS '群组成员表';
COMMENT ON COLUMN guild_members.id IS '关联ID';
COMMENT ON COLUMN guild_members.guild_id IS '群组ID';
COMMENT ON COLUMN guild_members.user_id IS '用户ID';
COMMENT ON COLUMN guild_members.role IS '角色';
COMMENT ON COLUMN guild_members.group_nickname IS '群内昵称';
COMMENT ON COLUMN guild_members.joined_at IS '加入时间';
COMMENT ON COLUMN guild_members.left_at IS '离开时间';
COMMENT ON COLUMN guild_members.created_at IS '创建时间';
COMMENT ON COLUMN guild_members.updated_at IS '更新时间';

CREATE INDEX idx_guild_members_guild_id ON guild_members(guild_id) WHERE left_at IS NULL;
CREATE INDEX idx_guild_members_user_id ON guild_members(user_id) WHERE left_at IS NULL;
CREATE INDEX idx_guild_members_role ON guild_members(role) WHERE left_at IS NULL;

-- =============================================
-- 业务层 - 开团与报名
-- =============================================

-- 副本开团表
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    guild_id INT NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    creator_id INT NOT NULL REFERENCES users(id),
    title VARCHAR(100) NOT NULL,
    team_time TIMESTAMP NOT NULL,
    dungeon VARCHAR(50) NOT NULL,
    max_members INT DEFAULT 25, -- 最大人数
    is_xuanjing_booked BOOLEAN DEFAULT FALSE,
    is_yuntie_booked BOOLEAN DEFAULT FALSE,
    is_hidden BOOLEAN DEFAULT FALSE, -- 是否对成员隐藏（业务逻辑）
    is_locked BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'open', -- 状态: open(开启), completed(完成), cancelled(取消), deleted(删除)
    rule JSONB NOT NULL,
    notice TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP,
    closed_by INT REFERENCES users(id)
);

COMMENT ON TABLE teams IS '副本开团表';
COMMENT ON COLUMN teams.id IS '开团ID';
COMMENT ON COLUMN teams.guild_id IS '群组ID';
COMMENT ON COLUMN teams.creator_id IS '创建者ID';
COMMENT ON COLUMN teams.title IS '开团标题';
COMMENT ON COLUMN teams.team_time IS '开团时间';
COMMENT ON COLUMN teams.dungeon IS '副本名称';
COMMENT ON COLUMN teams.max_members IS '最大人数';
COMMENT ON COLUMN teams.is_xuanjing_booked IS '是否预定玄晶';
COMMENT ON COLUMN teams.is_yuntie_booked IS '是否预定陨铁';
COMMENT ON COLUMN teams.is_hidden IS '是否对成员隐藏（业务逻辑）';
COMMENT ON COLUMN teams.is_locked IS '是否锁定';
COMMENT ON COLUMN teams.status IS '状态: open(开启), completed(完成), cancelled(取消), deleted(删除)';
COMMENT ON COLUMN teams.rule IS '报名规则';
COMMENT ON COLUMN teams.notice IS '团队告示';
COMMENT ON COLUMN teams.created_at IS '创建时间';
COMMENT ON COLUMN teams.updated_at IS '更新时间';
COMMENT ON COLUMN teams.closed_at IS '关闭时间';
COMMENT ON COLUMN teams.closed_by IS '关闭者ID';

CREATE INDEX idx_teams_guild_id ON teams(guild_id) WHERE status != 'deleted';
CREATE INDEX idx_teams_creator_id ON teams(creator_id);
CREATE INDEX idx_teams_team_time ON teams(team_time) WHERE status != 'deleted';
CREATE INDEX idx_teams_status ON teams(status);
CREATE INDEX idx_teams_dungeon ON teams(dungeon) WHERE status != 'deleted';

-- 开团模板表
CREATE TABLE team_templates (
    id SERIAL PRIMARY KEY,
    guild_id INT NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    creator_id INT NOT NULL REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    rule JSONB NOT NULL,
    notice TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE team_templates IS '开团模板表';
COMMENT ON COLUMN team_templates.id IS '模板ID';
COMMENT ON COLUMN team_templates.guild_id IS '群组ID';
COMMENT ON COLUMN team_templates.creator_id IS '创建者ID';
COMMENT ON COLUMN team_templates.name IS '模板名称';
COMMENT ON COLUMN team_templates.rule IS '报名规则';
COMMENT ON COLUMN team_templates.notice IS '团队告示';
COMMENT ON COLUMN team_templates.created_at IS '创建时间';
COMMENT ON COLUMN team_templates.updated_at IS '更新时间';

CREATE INDEX idx_team_templates_guild_id ON team_templates(guild_id);
CREATE INDEX idx_team_templates_creator_id ON team_templates(creator_id);

-- 副本报名表
CREATE TABLE signups (
    id SERIAL PRIMARY KEY,
    team_id INT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    submitter_id INT NOT NULL REFERENCES users(id), -- 提交者
    signup_user_id INT REFERENCES users(id), -- 报名用户
    signup_character_id INT REFERENCES characters(id), -- 报名角色
    signup_info JSONB, -- 补充信息
    priority INT DEFAULT 0,
    is_rich BOOLEAN DEFAULT FALSE, -- 是否老板
    is_proxy BOOLEAN DEFAULT FALSE, -- 是否代报名
    slot_position INT, -- 锁定位置
    is_absent BOOLEAN DEFAULT FALSE, -- 是否缺席
    detail JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cancelled_by INT REFERENCES users(id),
    cancelled_at TIMESTAMP
);

COMMENT ON TABLE signups IS '副本报名表';
COMMENT ON COLUMN signups.id IS '报名ID';
COMMENT ON COLUMN signups.team_id IS '开团ID';
COMMENT ON COLUMN signups.submitter_id IS '提交者ID';
COMMENT ON COLUMN signups.signup_user_id IS '报名用户ID';
COMMENT ON COLUMN signups.signup_character_id IS '报名角色ID';
COMMENT ON COLUMN signups.signup_info IS '报名信息';
COMMENT ON COLUMN signups.priority IS '优先级';
COMMENT ON COLUMN signups.is_rich IS '是否老板';
COMMENT ON COLUMN signups.is_proxy IS '是否代报名';
COMMENT ON COLUMN signups.slot_position IS '锁定位置';
COMMENT ON COLUMN signups.is_absent IS '是否缺席';
COMMENT ON COLUMN signups.detail IS '详情';
COMMENT ON COLUMN signups.created_at IS '创建时间';
COMMENT ON COLUMN signups.updated_at IS '更新时间';
COMMENT ON COLUMN signups.cancelled_by IS '取消者ID';
COMMENT ON COLUMN signups.cancelled_at IS '取消时间';

CREATE INDEX idx_signups_team_id ON signups(team_id);
CREATE INDEX idx_signups_submitter_id ON signups(submitter_id);
CREATE INDEX idx_signups_signup_user_id ON signups(signup_user_id);
CREATE INDEX idx_signups_signup_character_id ON signups(signup_character_id);
CREATE INDEX idx_signups_cancelled_at ON signups(cancelled_at);

-- =============================================
-- 业务层 - 金团记录
-- =============================================

-- 金团记录表
CREATE TABLE gold_team_records (
    id SERIAL PRIMARY KEY,
    guild_id INT NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    team_id INT REFERENCES teams(id) ON DELETE SET NULL, -- 关联开团（可选）

    -- 基本信息
    dungeon VARCHAR(50) NOT NULL,
    run_date DATE NOT NULL,

    -- 金团数据
    total_gold DECIMAL(12, 2) DEFAULT 0, -- 总金团
    worker_count INT DEFAULT 0, -- 打工人数
    special_drops TEXT[], -- 特殊掉落表（字符串数组）

    -- 黑本人（第一个进本的人）
    heibenren_user_id INT REFERENCES users(id), -- 黑本人用户ID（可选）
    heibenren_character_id INT REFERENCES characters(id), -- 黑本人角色ID（可选）
    heibenren_info JSONB, -- 黑本人显示信息
    /*
    示例：
    {
      "user_name": "张三",      // 用户名称
      "character_name": "角色名"  // 角色名称
    }
    如果有ID，后端从数据库取值覆盖对应字段；否则使用用户填写的值
    */

    notes TEXT, -- 备注

    -- 审计字段
    creator_id INT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP -- 软删除
);

COMMENT ON TABLE gold_team_records IS '金团记录表';
COMMENT ON COLUMN gold_team_records.id IS '记录ID';
COMMENT ON COLUMN gold_team_records.guild_id IS '群组ID';
COMMENT ON COLUMN gold_team_records.team_id IS '关联的开团ID（可选）';
COMMENT ON COLUMN gold_team_records.dungeon IS '副本名称';
COMMENT ON COLUMN gold_team_records.run_date IS '开团日期';
COMMENT ON COLUMN gold_team_records.total_gold IS '总金团';
COMMENT ON COLUMN gold_team_records.worker_count IS '打工人数';
COMMENT ON COLUMN gold_team_records.special_drops IS '特殊掉落表';
COMMENT ON COLUMN gold_team_records.heibenren_user_id IS '黑本人用户ID';
COMMENT ON COLUMN gold_team_records.heibenren_character_id IS '黑本人角色ID';
COMMENT ON COLUMN gold_team_records.heibenren_info IS '黑本人显示信息';
COMMENT ON COLUMN gold_team_records.notes IS '备注';
COMMENT ON COLUMN gold_team_records.creator_id IS '创建者ID';
COMMENT ON COLUMN gold_team_records.created_at IS '创建时间';
COMMENT ON COLUMN gold_team_records.updated_at IS '更新时间';
COMMENT ON COLUMN gold_team_records.deleted_at IS '删除时间';

CREATE INDEX idx_gold_team_records_guild_id ON gold_team_records(guild_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_gold_team_records_team_id ON gold_team_records(team_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_gold_team_records_run_date ON gold_team_records(run_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_gold_team_records_creator_id ON gold_team_records(creator_id);
CREATE INDEX idx_gold_team_records_heibenren_user_id ON gold_team_records(heibenren_user_id);
CREATE INDEX idx_gold_team_records_heibenren_character_id ON gold_team_records(heibenren_character_id);

-- =============================================
-- 触发器：自动更新 updated_at
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要的表创建触发器
CREATE TRIGGER update_system_admins_updated_at BEFORE UPDATE ON system_admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guild_subscriptions_updated_at BEFORE UPDATE ON guild_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_characters_updated_at BEFORE UPDATE ON characters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_character_players_updated_at BEFORE UPDATE ON character_players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guilds_updated_at BEFORE UPDATE ON guilds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guild_members_updated_at BEFORE UPDATE ON guild_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_templates_updated_at BEFORE UPDATE ON team_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_signups_updated_at BEFORE UPDATE ON signups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gold_team_records_updated_at BEFORE UPDATE ON gold_team_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


COMMIT;
