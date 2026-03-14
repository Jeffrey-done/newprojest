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

## 安全建议

- 给 `/admin/*` 开启 Cloudflare Access 或页面密码保护。
- 使用最小权限 Fine-grained token。
- 定期轮换 token。

