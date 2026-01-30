# 羽球一家人 (Badminton Family)

一个健全、响应式的羽毛球对战管理系统。

## 🏗 项目结构

### 后端 (Backend)
- 路径: `backend/`
- 技术栈: Node.js, Express, SQLite
- 核心文件:
  - `index.js`: 主服务入口，RESTful API 实现
  - `db.js`: 数据库连接与 Schema 定义
  - `matchMaker.js`: 对阵编排算法核心
  - `database.sqlite`: 数据存储文件

### 前端 (Frontend)
- 路径: `frontend/`
- 技术栈: Vue 3 (Vite), Vue Router, Tailwind CSS, Animate.css
- 目录说明:
  - `src/router/`: 路由配置 (Home, Create, Detail, Player)
  - `src/views/`: 业务页面组件
  - `src/App.vue`: 主框架
  - `index.html`: 模板文件

## 🚀 启动说明

### 后端启动
```bash
cd backend
npm install
node index.js
```

### 前端构建 (Vite)
```bash
cd frontend
npm install
npm run build
```

## 🛠 数据库定义
参考根目录下的 `SCHEMA.sql`。

---
Updated by Aster ✨
