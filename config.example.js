window.BLOG_CONFIG = {
  site: {
    title: '我的博客',
    description: '一个运行在 Cloudflare Pages 的 Markdown 博客',
    language: 'zh-CN'
  },
  github: {
    owner: 'your-github-username',
    repo: 'cf-github-blog',
    branch: 'main',
    postsDir: 'posts',
    uploadsDir: 'posts/uploads',
    token: 'ghp_xxx_replace_me',
    useProxy: false,
    proxyBase: '/api/github'
  },
  features: {
    showDrafts: false,
    markdownPreview: true,
    confirmBeforeDelete: true,
    maxTitleLength: 80
  }
};
