// 本地演示配置：请替换 owner/repo/token
window.BLOG_CONFIG = {
  site: {
    title: 'Gblog',
    description: 'Cloudflare + GitHub 的轻量可视化博客方案',
    language: 'zh-CN'
  },
  github: {
    owner: 'Jeffrey-done',
    repo: 'newprojest',
    branch: 'main',
    postsDir: 'posts',
    uploadsDir: 'posts/uploads',
    token: '',
    useProxy: false,
    proxyBase: '/api/github'
  },
  features: {
    showDrafts: false,
    markdownPreview: true,
    confirmBeforeDelete: true,
    maxTitleLength: 80,
    pageSize: 8
  }
};
