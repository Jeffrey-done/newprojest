# SubScript Lite: Cloudflare + GitHub 静态博客（含可视化后台）

一个纯前端、无服务器的 Markdown 博客方案：

- 读者端：展示文章列表与文章详情
- 管理端：`/admin` 进行文章新增 / 编辑 / 删除（可视化富文本编辑）
- 存储：GitHub 仓库 `posts/` 目录
- 部署：Cloudflare Pages

## 目录结构

```txt
.
├── index.html
├── post.html
├── admin/
│   ├── index.html
│   ├── edit.html
│   └── utils.js
├── assets/
│   ├── marked.min.js
│   └── style.css
├── posts/
│   └── hello-world.md
└── config.example.js
```

## 快速开始

1. Fork/克隆后，将 `config.example.js` 复制为 `config.js`。
2. 在 `config.js` 中填写：
   - `owner`
   - `repo`
   - `branch`
   - `token`
   - `uploadsDir`（本地图片上传目录）
   - 例如当前仓库可填写：`owner=Jeffrey-done`、`repo=newprojest`
3. 将项目部署到 Cloudflare Pages。
4. 访问：
   - 前台：`/`（对访客展示，Hexo 类博客风格）
   - 后台：`/admin/`（仅管理者使用，不在前台暴露入口）

> 注意：`token` 放前端仅适合个人使用。生产建议用 Cloudflare Worker 作为中间层隐藏 token。


## 推荐：开启代理模式（隐藏 GitHub Token）

为避免在浏览器里暴露 Token，项目已内置 `functions/api/github/[[path]].js`。

配置步骤：

1. 在 Cloudflare Pages 项目里添加环境变量：`GITHUB_TOKEN`（有仓库 Contents 读写权限）。
   - 推荐同时配置：`GITHUB_OWNER`、`GITHUB_REPO`（用于代理层限制只允许访问指定仓库）。
2. 在 `config.js` 中开启：
   - `github.useProxy = true`
   - `github.proxyBase = '/api/github'`
3. 重新部署后，后台将通过 Pages Functions 代理访问 GitHub API，前端不再需要粘贴 Token。

> 本地开发若不跑 Functions，可先保持 `useProxy: false`。

## Cloudflare Pages 部署（避免构建报错）

如果你在 Pages 日志里看到：`Executing user command: None` 并报 `/bin/sh: 1: None: not found`，说明 **Build command 被错误地填写成了字符串 `None`**。

请在 Cloudflare Pages 项目设置中这样配置：

- Framework preset: `None`
- Build command: **留空（Empty）**，不要填 `None`
- Build output directory: `/`（或 `.`）
- Root directory: `/`

本仓库已提供 `wrangler.toml`，声明 `pages_build_output_dir = "."` 供 Pages 自动识别。

## 安全建议

- 给 `/admin/*` 开启 Cloudflare Access 或页面密码保护。
- 使用最小权限 Fine-grained token。
- 定期轮换 token。
- Pages Functions 代理建议只允许 `repos/{owner}/{repo}/contents/*` 路径（本仓库默认已限制）。


## Token 常见报错排查

如果后台弹窗提示：`Resource not accessible by personal access token`，通常是权限范围问题。

请检查：

- Token 是否授权了你当前配置的仓库（`owner/repo`）。
- Fine-grained token 的仓库权限里：`Contents` 是否是 **Read and write**。
- Token 对应账号是否有仓库写权限（协作者/组织权限）。
- `config.js` 里的 `branch` 是否存在且可写。

> 后台编辑页会显示“当前写入目标”，请确认和你实际仓库一致。


## 站点图标（Favicon）

- 当前已启用图标文件：`/assets/icons/favicon.svg`。
- 前台与后台页面都已统一引用该图标。
- 如需替换成你自己的图片，保持文件名不变直接覆盖即可。



## 后台编辑体验

- 后台默认是接近 Word 的可视化编辑（不需要 Markdown 语法）。
- 支持标题、字体样式、颜色、列表、对齐、链接、清除格式等常用排版功能。
- 支持插入图片：
  - 图片 URL 直接插入；
  - 本地图片会先上传到 GitHub 仓库（`uploadsDir`），再插入可访问链接（推荐）。
- 新建文章时，文件名不写后缀会自动补 `.html`。

- 支持粘贴 Word 内容（尽量保留基础格式）。


## 第一阶段增强（已完成）

- 自动草稿：后台编辑时会按会话自动保存本地草稿，并可自动恢复。
- 元数据：支持标题、日期、状态（公开/草稿）、置顶、标签、封面图、摘要。
- 前台搜索：首页支持按标题/摘要/标签实时检索。
- 前台浏览增强：支持标签筛选 + 分页（`features.pageSize` 可配置每页数量），并显示阅读时长与置顶标识。
- 发布状态：草稿默认不在前台展示；如需预览草稿可在 URL 添加 `?preview=1`。
- 前台缓存：首页会将文章列表缓存 5 分钟，提升重复访问速度（到期自动回源刷新）。
  - 支持 `?refresh=1` 强制绕过缓存刷新；
  - `?preview=1` 预览草稿时会自动绕过缓存。
- 后台列表增强：支持文件名搜索、排序、批量勾选删除、复制文章 raw 直链，以及总数/体积分布统计。
  - 支持一键预览文章（前台视图）；
  - 支持记住后台搜索词与排序偏好（浏览器本地存储）；
  - 批量删除会显示进度，并在失败时汇总提示失败条目。
- 后台视觉升级：采用带侧边栏、渐变 Hero、卡片化内容区的 Dashboard 风格布局（偏 Horizon UI 设计语言）。
  - 列表页与编辑页已统一为同一套 Dashboard 视觉风格。
