# 医疗客服 Agent

基于 Next.js 和 Vercel AI SDK 的智能医疗客服助手。

## 功能特点

- 智能医疗问答：基于 GPT-4 的医疗知识库
- 实时流式响应：提供流畅的对话体验
- 安全可靠：强调建议仅供参考，不替代专业医生
- 现代界面：简洁友好的用户界面

## 技术栈

- Next.js 16 (App Router)
- Vercel AI SDK
- OpenAI GPT-4
- TypeScript
- Tailwind CSS

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.local.example` 文件为 `.env.local`：

```bash
cp .env.local.example .env.local
```

在 `.env.local` 文件中配置你的 OpenAI API 密钥：

```
OPENAI_API_KEY=your_actual_api_key_here
```

### 3. 启动开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

## 项目结构

```
medical-agent/
├── src/
│   ├── app/                 # Next.js 应用目录
│   │   ├── api/            # API 路由
│   │   │   └── chat/       # 聊天 API
│   │   └── page.tsx        # 主页面
│   ├── agents/             # Agent 逻辑
│   │   └── medical-agent.ts # 医疗 Agent
│   ├── components/         # React 组件
│   │   └── ChatInterface.tsx # 聊天界面
│   ├── lib/               # 工具函数和配置
│   │   └── ai-config.ts   # AI SDK 配置
│   └── types/             # TypeScript 类型定义
│       └── agent.ts       # Agent 相关类型
├── public/               # 静态资源
└── package.json          # 项目配置
```

## 使用说明

1. 访问应用主页
2. 在输入框中输入医疗相关问题
3. AI 助手会提供专业、安全的建议
4. 注意：AI 回答仅供参考，不能替代专业医生的建议

## 安全提示

本应用仅提供医疗咨询参考，不作为诊断或治疗的依据。如有健康问题，请及时就医。

## 开发命令

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

## 许可证

MIT
