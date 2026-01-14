# Madoka - 智能搜索助手 v2.0

联网搜索增强 LLM 对话插件

## 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite + CRXJS
- **样式方案**: TailwindCSS
- **动画库**: Framer Motion
- **状态管理**: React Context + useReducer

## 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build
```

## 加载扩展

1. 运行 `npm run build`
2. 打开 Chrome，进入 `chrome://extensions/`
3. 启用「开发者模式」
4. 点击「加载已解压的扩展程序」
5. 选择 `dist` 目录

## 项目结构

```
src/
├── background/          # Service Worker
│   ├── index.ts        # 入口
│   ├── config.ts       # 配置管理
│   ├── search.ts       # 搜索逻辑
│   └── api.ts          # 通义 API
├── content/            # Content Script
│   ├── index.ts        # 入口
│   ├── reader.ts       # 页面读取
│   └── parser.ts       # 搜索解析
├── sidepanel/          # Side Panel (React)
│   ├── components/     # UI 组件
│   ├── hooks/          # 自定义 Hooks
│   ├── context/        # 状态管理
│   └── styles/         # 设计系统
├── shared/             # 共享模块
│   ├── types.ts        # 类型定义
│   ├── constants.ts    # 常量
│   └── messaging.ts    # Chrome API 封装
└── manifest.json       # 扩展清单
```

## 设计特点

- **沉浸式体验**: AI 回答时自动隐藏非必要 UI
- **极简配色**: 纯黑白灰，让内容成为焦点
- **流体动画**: Spring 物理动画，自然流畅
- **微交互**: 呼吸动画、悬浮反馈、状态指示

---

*基于 Jina Reader 技术*
