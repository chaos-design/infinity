# 贡献指南

感谢你愿意参与 Infinity 的建设。本指南说明如何提交 Issue、准备本地开发环境、发起 Pull Request，以及在合并前完成必要验证。

## 参与方式

- **报告 Bug**: 使用 GitHub Issue 中的 Bug Report 模板，提供复现步骤、浏览器版本、系统信息和截图或控制台日志。
- **提出功能建议**: 使用 Feature Request 模板，重点说明用户问题、期望行为、影响范围和可参考的产品或截图。
- **改进文档**: 使用 Documentation 模板，指出具体文件、章节或链接，并尽量给出建议修改内容。
- **提交代码**: Fork 仓库后基于最新 `main` 创建分支，完成开发、验证和 PR 描述。

## 开发环境

请确保本地环境满足以下要求:

- Node.js 18 或更高版本，推荐使用 Node.js 22。
- npm。
- Chrome 或 Chromium 内核浏览器。

安装依赖:

```bash
npm install
```

启动 WXT 开发模式:

```bash
npm run dev
```

开发模式会生成可加载的扩展目录。修改 manifest、权限或扩展入口后，建议前往 `chrome://extensions/` 手动刷新扩展，再重新打开新标签页验证。

## 分支规范

建议使用语义化分支名称:

- `feat/<short-name>`: 新功能。
- `fix/<short-name>`: Bug 修复。
- `docs/<short-name>`: 文档更新。
- `chore/<short-name>`: 工程配置、依赖、发布流程等维护性变更。
- `refactor/<short-name>`: 不改变行为的结构调整。

请避免直接在 `main` 分支开发。

## 代码规范

- TypeScript 函数名使用小驼峰。
- 前端文件名使用小写和短横线分隔。
- UI 组件优先复用现有 `components/ui` 基础组件。
- 配置变更后需要确认用户可见行为是否需要 toast 反馈。
- 不要提交 `.output`、`coverage`、`.wxt`、日志文件或本地编辑器配置。

## 提交前检查

提交 PR 前请至少运行:

```bash
npm run lint
npm run compile
npm run build
```

如变更涉及扩展分发资源，也请运行:

```bash
npm run zip
```

如变更涉及 Firefox 构建，请额外运行:

```bash
npm run build:firefox
npm run zip:firefox
```

如果修改了交互逻辑、hooks、存储逻辑或复杂组件，请补充或更新相应测试，并运行相关测试命令。

## Pull Request 流程

1. 确认分支基于最新 `main`。
2. 保持 PR 聚焦，避免在一个 PR 中混合无关变更。
3. 按 PR 模板填写变更说明、验证结果、影响范围和关联 Issue。
4. UI 变更请附带截图或录屏，最好包含变更前后对比。
5. 等待维护者 Review，并根据反馈更新代码。

## Issue 与 PR 质量要求

- Bug 需要可复现步骤，尽量包含浏览器版本、系统信息和日志。
- 功能建议需要描述实际用户问题，而不仅是实现方案。
- PR 需要说明为什么修改、修改了什么、如何验证。
- 对现有行为有破坏性影响时，请在 PR 中显式说明迁移或兼容方案。

## 发布说明

项目通过 GitHub Actions 触发 Release。推送 `v*` tag 或手动运行 Release workflow 后，会执行静态检查、类型检查、扩展打包，并上传 WXT 生成的 zip 资源。

发布前请确认:

- `package.json` 与 `wxt.config.ts` 中的版本号符合预期。
- `npm run lint`、`npm run compile`、`npm run zip` 均通过。
- Release notes 中包含面向用户的主要变化。

## 行为准则

参与讨论、Issue、PR Review 或代码贡献时，请遵守项目的 [行为准则](./CODE_OF_CONDUCT.md)。请保持尊重、具体和建设性。

## 安全问题

如发现安全漏洞，请不要创建公开 Issue。请按照 [安全策略](./SECURITY.md) 中的方式进行私密报告。
