-- 副本统计数据表迁移脚本
-- 用于记录每个公会每个副本类型的统计数据（最大值、最小值等）

BEGIN;

-- 创建副本统计数据表
CREATE TABLE IF NOT EXISTS dungeon_stats (
    id SERIAL PRIMARY KEY,  -- 统计ID, 自增主键
    guild_id INT NOT NULL,  -- 群组ID, 外键
    dungeon_name VARCHAR(50) NOT NULL,  -- 副本名称
    total_count INT NOT NULL DEFAULT 0,  -- 总记录数
    min_salary INT NOT NULL DEFAULT 0,  -- 最低总金团
    max_salary INT NOT NULL DEFAULT 0,  -- 最高总金团
    avg_salary DECIMAL(10, 2) NOT NULL DEFAULT 0,  -- 平均总金团
    min_per_person_salary INT NOT NULL DEFAULT 0,  -- 最低人均金团
    max_per_person_salary INT NOT NULL DEFAULT 0,  -- 最高人均金团
    avg_per_person_salary DECIMAL(10, 2) NOT NULL DEFAULT 0,  -- 平均人均金团
    min_salary_team_id INT,  -- 最低金团对应的团队ID
    max_salary_team_id INT,  -- 最高金团对应的团队ID
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 更新时间
    FOREIGN KEY (guild_id) REFERENCES guilds(id) ON DELETE CASCADE,  -- 外键关联群组表, 级联删除
    UNIQUE(guild_id, dungeon_name)  -- 确保每个公会的每个副本只有一条统计记录
);

-- 添加副本统计数据表注释
COMMENT ON TABLE dungeon_stats IS '副本统计数据表';
COMMENT ON COLUMN dungeon_stats.id IS '统计ID';
COMMENT ON COLUMN dungeon_stats.guild_id IS '群组ID';
COMMENT ON COLUMN dungeon_stats.dungeon_name IS '副本名称';
COMMENT ON COLUMN dungeon_stats.total_count IS '总记录数';
COMMENT ON COLUMN dungeon_stats.min_salary IS '最低总金团';
COMMENT ON COLUMN dungeon_stats.max_salary IS '最高总金团';
COMMENT ON COLUMN dungeon_stats.avg_salary IS '平均总金团';
COMMENT ON COLUMN dungeon_stats.min_per_person_salary IS '最低人均金团';
COMMENT ON COLUMN dungeon_stats.max_per_person_salary IS '最高人均金团';
COMMENT ON COLUMN dungeon_stats.avg_per_person_salary IS '平均人均金团';
COMMENT ON COLUMN dungeon_stats.min_salary_team_id IS '最低金团对应的团队ID';
COMMENT ON COLUMN dungeon_stats.max_salary_team_id IS '最高金团对应的团队ID';
COMMENT ON COLUMN dungeon_stats.create_time IS '创建时间';
COMMENT ON COLUMN dungeon_stats.update_time IS '更新时间';

-- 创建副本统计数据表索引
CREATE INDEX idx_dungeon_stats_guild_id ON dungeon_stats(guild_id);
CREATE INDEX idx_dungeon_stats_dungeon_name ON dungeon_stats(dungeon_name);
CREATE INDEX idx_dungeon_stats_guild_dungeon ON dungeon_stats(guild_id, dungeon_name);

COMMIT;
