# 项目搭建指令记录

## 创建时间
2026-04-09 17:50

## 初始化项目指令
```bash
# 创建Next.js项目（TypeScript + Tailwind）
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git
```

## 依赖安装指令
```bash
# 安装Vercel AI SDK
npm install ai

# 安装OpenAI AI SDK集成
npm install @ai-sdk/openai
```

## 目录创建指令
```bash
# 创建项目基础目录结构
mkdir -p src/lib src/components src/types src/agents

# 对于Windows PowerShell
New-Item -ItemType Directory -Path "src\lib" -Force
New-Item -ItemType Directory -Path "src\components" -Force
New-Item -ItemType Directory -Path "src\types" -Force
New-Item -ItemType Directory -Path "src\agents" -Force

# 创建API路由目录
New-Item -ItemType Directory -Path "src\app\api\chat" -Force
```

## 开发服务器启动指令
```bash
npm run dev
```

## 项目构建和部署指令
```bash
# 开发模式
npm run dev

# 生产构建
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint
```
