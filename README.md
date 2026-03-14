# SubScript Lite: Cloudflare + GitHub 静态博客（含可视化后台）

一个纯前端、无服务器的 Markdown 博客方案：

- 读者端：展示文章列表与文章详情
- 管理端：`/admin` 进行文章新增 / 编辑 / 删除
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
3. 将项目部署到 Cloudflare Pages。
4. 访问：
   - 前台：`/`（对访客展示，Hexo 类博客风格）
   - 后台：`/admin/`（仅管理者使用，不在前台暴露入口）

> 注意：`token` 放前端仅适合个人使用。生产建议用 Cloudflare Worker 作为中间层隐藏 token。


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


## Token 常见报错排查

如果后台弹窗提示：`Resource not accessible by personal access token`，通常是权限范围问题。

请检查：

- Token 是否授权了你当前配置的仓库（`owner/repo`）。
- Fine-grained token 的仓库权限里：`Contents` 是否是 **Read and write**。
- Token 对应账号是否有仓库写权限（协作者/组织权限）。
- `config.js` 里的 `branch` 是否存在且可写。

> 后台编辑页会显示“当前写入目标”，请确认和你实际仓库一致。

