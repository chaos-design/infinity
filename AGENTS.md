# AGENTS.md

> 本文件面向 AI / 自动化代理（Cursor、Claude Code、Codex、GitHub Copilot Workspace 等），用于快速、准确地理解本项目并按统一规范完成开发任务。所有 AI 在本仓库工作时**必须**先阅读本文件。

## 1. 项目身份

- **名称**：`@chaos-design/infinity`
- **类别**：Chrome / Edge / Firefox 浏览器扩展（New Tab 替换型）
- **仓库**：<https://github.com/chaos-design/infinity>
- **Manifest**：MV3（Firefox 走 MV2 自动降级，由 WXT 处理）
- **核心产物**：替换浏览器默认新标签页，提供搜索、快捷方式、时钟、外观主题、打开标签页管理与域名标签体系。

## 2. 技术栈与版本（硬约束）

| 类别 | 选型 | 版本 | 备注 |
| --- | --- | --- | --- |
| 扩展框架 | [WXT](https://wxt.dev) | `^0.20.26` | manifest、entrypoints、热更新均由 WXT 接管 |
| 构建 | Vite | `^8.0` | 由 WXT 调度，不直接配置 rollup/webpack |
| 语言 | TypeScript | `^5.9` | `tsc --noEmit` 严格模式 |
| 框架 | React | `^19` | 仅函数组件 + Hooks，禁止 class 组件 |
| 样式 | Tailwind CSS 3 + Emotion + Styled Components | — | 优先 Tailwind utility，复杂动效用 emotion / styled |
| UI 基础 | Radix UI + shadcn/ui 风格 | — | 自有组件位于 `components/ui` |
| 图标 | `lucide-react` | `^1.16` | 全站统一图标库 |
| 反馈 | `sonner` | `^2` | 全局 toast |
| 测试 | Vitest + @testing-library/react + jsdom | Vitest `^4.1` | 配置见 `vitest.config.ts` |
| Lint / Format | Biome 2 | `^2.4` | 不引入 ESLint / Prettier |
| 包管理 | pnpm | 使用项目 `pnpm-lock.yaml` 对应版本 | 不在 `package.json` 中锁定 pnpm 版本 |
| 运行时 | Node | `22.12+`，由 `package.json#engines` 约束 | 与 WXT 0.20+ 保持兼容 |

> **AI 修改依赖前必须先确认**：是否触发 vite / wxt / vitest 的 peer 锁定；改动后 `pnpm install` 必须能在 `engine-strict` 下通过。

## 3. 目录结构（重点路径）

```
.
├── entrypoints/newtab/      # 唯一 entrypoint：新标签页（app.tsx / main.tsx / index.html）
├── components/              # 业务组件（PascalCase 命名 + hyphen-cased 文件名）
│   └── ui/                  # shadcn/ui 风格的基础组件（不要随意改 API）
├── hooks/                   # use-* hooks（chrome.storage、tabs、tags）
├── lib/                     # 纯逻辑：tag-storage、tag-relations、utils
├── test/                    # Vitest 测试，文件后缀 .test.ts(x)
├── scripts/
│   ├── release.mjs          # 自动版本 bump + tag + push（patch only）
│   ├── check-engines.mjs    # preinstall 守卫
│   └── compress-screenshots.mjs
├── wxt.config.ts            # manifest（permissions、name、version 注入）
├── vitest.config.ts         # 测试 + coverage（>=90% 阈值）
├── biome.json               # 风格规则
├── tsconfig.json            # 继承 .wxt/tsconfig.json
├── package.json             # 依赖与脚本
```

`/.wxt/` 与 `/.output/` 是**生成产物**，禁止手工编辑或提交（已在 `.gitignore`）。

## 4. 编码与命名规范（强制）

> 来自项目用户偏好与 Biome 规则，AI 必须遵守。

- **文件名**：全小写 + `-` 连字符（`tab-manager.tsx`、`use-settings.ts`）。
- **函数 / 变量**：lowerCamelCase（`getTabsByDomain`、`isLoading`）。
- **React 组件**：PascalCase 标识符 + hyphen-cased 文件名（`TabManager` 在 `tab-manager.tsx`）。
- **Hooks**：`use-*` 前缀，文件 + 命名一致。
- **样式**：优先 Tailwind utility class；玻璃拟态（glassmorphism）+ 紧凑布局；圆角默认 `rounded-lg`；高密度图标按钮。
- **稳定性**：与 `chrome.storage` / `chrome.tabs` 高频事件交互的 hook 必须 50ms 防抖 + 深度相等性比较，避免 React #185。
- **状态切换确认**：所有状态切换交互需提供 `Popconfirm` 类二次确认。
- **日志**：接口/异步交互打印 `start / success / failure(status, costMs)` 三段式。
- **无障碍**：图标按钮必须有 `aria-label`。
- **禁止**：emoji（除非用户显式要求）、新建无关文档（README / *.md）、过度抽象、向后兼容垫片。

## 5. 工作流：AI 编辑代码必须遵循

### 5.1 接到任务时的固定动作

1. **先读 README + 本文件**，了解功能范围与禁区。
2. **看 `package.json` + `wxt.config.ts`** 确认当前依赖版本与 manifest 权限。
3. **改动前 grep / search**，避免重复实现已有 hook / util。
4. **不写新文件**，除非确实需要新增模块；优先编辑既有文件。

### 5.2 改完代码必须自检（Definition of Done）

按顺序运行（任意一步失败都要修复后重跑）：

```bash
pnpm exec wxt prepare        # 重新生成 .wxt/types
pnpm lint                    # Biome 静态检查（0 警告 0 错误）
pnpm compile                 # tsc --noEmit
pnpm exec vitest run         # 全部用例必须通过
pnpm build                   # 至少 Chrome MV3 构建通过
```

测试覆盖率阈值：lines / functions / branches / statements **均 ≥ 90%**（`vitest.config.ts`），新增逻辑必须补 unit test（正例 + 反例 + 边界）。

### 5.3 改 chrome.storage 数据结构时

- 必须提供回退默认值与脏数据兜底（参考 `useSettings` 中对非法 `tabsViewMode` / `theme` / `backgroundType` 的处理）。
- 不允许覆盖 / 删除已有用户字段；新增字段提供 migration（默认值即可）。
- 写入前用深度相等比较，避免无意义触发 `chrome.storage.onChanged`。

### 5.4 触发 React 渲染相关改动时

- 不要在 effect 里直接 setState 一个新引用对象，必须先 deep equal。
- 多窗口场景下避免广播风暴：`chrome.storage.onChanged` 监听需 debounce ≥ 50ms。
- 新增 hook 时，参考 `hooks/use-tabs.ts` 的并发保护与事件合并模式。

## 6. 命令矩阵

```bash
# 开发
pnpm dev               # WXT dev 服务器（Chrome MV3）
pnpm dev:firefox       # Firefox MV2

# 构建
pnpm build             # Chrome 产物 -> .output/chrome-mv3
pnpm build:firefox
pnpm zip               # 打包 zip
pnpm zip:firefox

# 质量
pnpm lint              # Biome check
pnpm format            # Biome write
pnpm compile           # tsc --noEmit
pnpm exec vitest run
pnpm exec vitest --coverage

# 发布
pnpm release:auto      # 自动 patch bump + tag + push
```

> AI 不得在脚本里偷偷把 `pnpm` 换成 `npm` / `yarn` —— 会被 `preinstall` 守卫拒绝。

## 7. 发布流程（AI 不得擅自触发）

- 版本号在 `package.json#version`，由 `wxt.config.ts` 注入到 `manifest.version`。
- `scripts/release.mjs` 仅做 patch bump，自动检测远端已有 tag，不会撞车。
- `.github/workflows/release.yml` 监听 `v*` tag，使用 Node 22 + corepack + `pnpm install --frozen-lockfile` 构建并发布 GitHub Release。
- **AI 默认不要执行 `pnpm release:auto`**，必须由用户显式发起。

## 8. 红线（任何情况下都不要做）

1. ❌ 修改全局 git config / push --force 到 main / 重写历史。
2. ❌ 新建 README / 设计文档 / 脚手架说明等文档，除非用户显式要求。
3. ❌ 引入 ESLint / Prettier / Webpack / Rollup（项目已锁定 Biome + Vite/Rolldown）。
4. ❌ 添加重型依赖前未确认体积与必要性（当前产物 ~625 KB，需保持单 chunk 友好）。
5. ❌ 在 hooks 里直接调用 `setState(newObj)` 触发循环渲染（必须深比较）。
6. ❌ 在 manifest 中新增 `permissions` 而不更新 `PRIVACY.md` 与 README 的"权限与隐私"段。
7. ❌ 提交 `.output/`、`coverage/`、`node_modules/`、本地测试快照。
8. ❌ 主动 `git commit` —— 必须由用户显式说"提交"或"commit"才能发起。

## 9. 与人类协作的对话礼仪

- 中文优先，回应保持结构化、最小修改、直奔结论。
- 修改前列出"会改哪些文件 / 影响什么"，避免 surprise。
- 给出选项时使用清晰可选项，并标注"推荐"。
- 长任务用 todo list 追踪，做完一项就标记 completed。
- 不要为可避免的"改进"而扩大改动面（lint 顺手修、注释顺手改）—— 与用户偏好的"最小修改"冲突。

## 10. 快速自检清单（AI 提交结果前在心里过一遍）

- [ ] 文件名小写连字符 / 函数 lowerCamelCase / 组件 PascalCase
- [ ] 没有引入新 lint 警告（Biome）
- [ ] `pnpm compile` 通过
- [ ] 相关模块的单测已补充并通过
- [ ] `chrome.storage` / `chrome.tabs` 改动有 debounce + deep-equal 保护
- [ ] manifest 权限未变 或 已同步更新 `PRIVACY.md`
- [ ] 没有顺手改无关代码
- [ ] 未自动 commit / push
- [ ] 没有新增多余文档
