-- 羽球一家人 数据库结构 (SQLite 3)

-- 1. 活动表
CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,                                -- 活动名称
  type TEXT,                                -- 赛制类型
  players TEXT,                             -- 参赛人员名单 (JSON 数组)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. 选手档案表
CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE,                         -- 姓名 (唯一)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. 对局详情表
CREATE TABLE IF NOT EXISTS matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  activity_id INTEGER,                      -- 关联活动 ID
  round INTEGER,                            -- 轮次
  team_a TEXT,                              -- A队人员 (JSON 数组)
  team_b TEXT,                              -- B队人员 (JSON 数组)
  score_a INTEGER DEFAULT 0,                -- A队得分
  score_b INTEGER DEFAULT 0,                -- B队得分
  status TEXT DEFAULT 'pending',            -- 状态 (pending/finished)
  FOREIGN KEY(activity_id) REFERENCES activities(id)
);
