function getConfig() {
  const base = window.BLOG_CONFIG || {};
  const savedToken = sessionStorage.getItem('BLOG_ADMIN_TOKEN') || '';
  return {
    ...base,
    github: {
      ...base.github,
      token: savedToken || base?.github?.token || '',
      uploadsDir: base?.github?.uploadsDir || `${base?.github?.postsDir || 'posts'}/uploads`,
      useProxy: Boolean(base?.github?.useProxy),
      proxyBase: base?.github?.proxyBase || '/api/github'
    }
  };
}

function getAuthHeaderValue(token) {
  if (!token) return '';
  if (/^(gh[pous]_)/.test(token)) return `token ${token}`;
  return `Bearer ${token}`;
}

function buildHeaders() {
  const cfg = getConfig();
  const headers = {
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json'
  };

  if (!cfg.github.useProxy) {
    const auth = getAuthHeaderValue(cfg.github.token);
    if (auth) headers.Authorization = auth;
  }

  return headers;
}

function buildApi(path = '') {
  const cfg = getConfig();
  if (cfg.github.useProxy) {
    return `${cfg.github.proxyBase}/repos/${cfg.github.owner}/${cfg.github.repo}${path}`;
  }
  return `https://api.github.com/repos/${cfg.github.owner}/${cfg.github.repo}${path}`;
}

function decodeBase64Utf8(b64) {
  const normalized = (b64 || '').replace(/\n/g, '');
  return decodeURIComponent(escape(atob(normalized)));
}

function encodeBase64Utf8(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      const base64 = dataUrl.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('读取图片失败'));
    reader.readAsDataURL(file);
  });
}

async function ensureOk(res, fallbackMessage) {
  if (res.ok) return;
  const cfg = getConfig();
  let rawMessage = fallbackMessage;
  try {
    const data = await res.json();
    rawMessage = data.message || fallbackMessage;
  } catch {}

  let hint = '';
  if (cfg.github.useProxy && res.status === 500) {
    hint = '\n建议检查：Cloudflare Pages -> Settings -> Functions -> Environment variables 是否配置 GITHUB_TOKEN';
  } else if (rawMessage.includes('Resource not accessible by personal access token')) {
    hint = `\n建议检查：\n1) 该 Token 是否授权了仓库 ${cfg.github.owner}/${cfg.github.repo}\n2) Repository permissions -> Contents 是否为 Read and write\n3) Token 所属账号是否有该仓库写权限\n4) branch=${cfg.github.branch} 是否存在且可写`;
  } else if (rawMessage.includes('Bad credentials')) {
    hint = '\n建议检查：Token 是否过期、复制是否完整（无空格换行）';
  }

  throw new Error(`${fallbackMessage}（HTTP ${res.status}）\n${rawMessage}${hint}`);
}

export function saveToken(token) {
  sessionStorage.setItem('BLOG_ADMIN_TOKEN', token.trim());
}

export function clearToken() {
  sessionStorage.removeItem('BLOG_ADMIN_TOKEN');
}

export function getRuntimeTarget() {
  const cfg = getConfig();
  return {
    owner: cfg.github.owner,
    repo: cfg.github.repo,
    branch: cfg.github.branch,
    postsDir: cfg.github.postsDir,
    uploadsDir: cfg.github.uploadsDir,
    useProxy: cfg.github.useProxy
  };
}

function isPostFile(name) {
  const lower = name.toLowerCase();
  return lower.endsWith('.md') || lower.endsWith('.html') || lower.endsWith('.htm');
}

export async function getPosts() {
  const cfg = getConfig();
  const res = await fetch(
    `${buildApi(`/contents/${cfg.github.postsDir}`)}?ref=${cfg.github.branch}`,
    { headers: buildHeaders() }
  );
  await ensureOk(res, '获取文章列表失败');
  const files = await res.json();

  return files
    .filter((f) => f.type === 'file' && isPostFile(f.name))
    .sort((a, b) => a.name.localeCompare(b.name, cfg.site?.language || 'zh-CN'))
    .map((f) => ({ name: f.name, path: f.path, sha: f.sha, size: f.size, htmlUrl: f.html_url }));
}

export async function getPostContent(filePath) {
  const cfg = getConfig();
  const res = await fetch(
    `${buildApi(`/contents/${filePath}`)}?ref=${cfg.github.branch}`,
    { headers: buildHeaders() }
  );
  await ensureOk(res, '获取文章内容失败');
  const data = await res.json();
  return { content: decodeBase64Utf8(data.content), sha: data.sha, name: data.name };
}

export async function uploadImageAsset(file) {
  const cfg = getConfig();
  const ext = (file.name.split('.').pop() || 'png').toLowerCase();
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  const safeName = `img-${stamp}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `${cfg.github.uploadsDir}/${safeName}`;
  const base64 = await fileToBase64(file);

  const body = {
    message: `Upload image: ${safeName}`,
    content: base64,
    branch: cfg.github.branch
  };

  const res = await fetch(buildApi(`/contents/${path}`), {
    method: 'PUT',
    headers: buildHeaders(),
    body: JSON.stringify(body)
  });
  await ensureOk(res, '上传图片失败');

  return `https://raw.githubusercontent.com/${cfg.github.owner}/${cfg.github.repo}/${cfg.github.branch}/${path}`;
}

export async function upsertPost({ filename, content, sha }) {
  const cfg = getConfig();
  const safeName = filename.trim();
  const lower = safeName.toLowerCase();
  if (!safeName || !(lower.endsWith('.md') || lower.endsWith('.html') || lower.endsWith('.htm'))) {
    throw new Error('文件名必须以 .html / .htm / .md 结尾');
  }
  const path = `${cfg.github.postsDir}/${safeName}`;
  const body = {
    message: `${sha ? 'Update' : 'Create'} post: ${safeName}`,
    content: encodeBase64Utf8(content),
    branch: cfg.github.branch
  };
  if (sha) body.sha = sha;

  const res = await fetch(buildApi(`/contents/${path}`), {
    method: 'PUT',
    headers: buildHeaders(),
    body: JSON.stringify(body)
  });
  await ensureOk(res, '保存文章失败');
  return true;
}

export async function removePost({ filePath, sha }) {
  const cfg = getConfig();
  const res = await fetch(buildApi(`/contents/${filePath}`), {
    method: 'DELETE',
    headers: buildHeaders(),
    body: JSON.stringify({
      message: `Delete post: ${filePath}`,
      sha,
      branch: cfg.github.branch
    })
  });
  await ensureOk(res, '删除文章失败');
  return true;
}
