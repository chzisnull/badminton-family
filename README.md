# 羽球一家人 (Badminton Family)

一个健全、响应式的羽毛球对战管理系统，专为移动端优化。

## 🏗 项目架构

项目采用了前后端分离的现代化架构：

### 📂 根目录
- `backend/`: 后端服务目录
- `frontend/`: 前端 Vue 3 项目源码目录
- `SCHEMA.sql`: 数据库初始化脚本
- `README.md`: 项目说明文档

### 🖥 后端 (Node.js + Express + SQLite)
- `index.js`: 主程序入口，负责 API 路由和静态文件托管。
- `db.js`: 数据库连接、表结构定义及初始化逻辑。
- `matchMaker.js`: 核心对战生成算法（单打/固搭循环赛、多人轮转平衡算法）。
- `database.sqlite`: 自动生成的数据库文件。

### 🎨 前端 (Vue 3 + Vite + Tailwind CSS)
- `src/main.js`: 前端入口，挂载 Vue 实例及路由。
- `src/router/`: 路由配置，实现单页应用 (SPA) 导航。
- `src/views/`: 业务页面组件化：
  - `HomeView.vue`: 比赛记录列表与成员档案入口。
  - `CreateView.vue`: 可视化发起比赛（点击添加成员）。
  - `MatchDetailView.vue`: 实时对阵、计分与进度条。
  - `PlayerDetailView.vue`: 选手个人主页与战绩聚合。
- `dist/`: 生产环境构建产物（由后端托管）。

## 🚀 部署与运行

### 1. 后端环境
```bash
cd backend
npm install
node index.js
```
后端默认运行在 `3000` 端口。

### 2. 前端开发与构建
```bash
cd frontend
npm install
npm run dev   # 开发模式
npm run build # 生产构建
```

## 🌟 核心赛制算法
1. **多人轮转赛**：基于随机平衡算法，确保散客局中搭档不重复且上场场次平衡。
2. **循环赛**：采用圆桌编排法（Circle Method），支持多轮次循环。

---
Developed by Aster ✨ for 瀚舟.
