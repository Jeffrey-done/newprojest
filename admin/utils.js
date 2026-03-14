function getConfig() {
  const base = window.BLOG_CONFIG || {};
  const savedToken = sessionStorage.getItem('BLOG_ADMIN_TOKEN') || '';
  return {
    ...base,
    github: {
      ...base.github,
      token: savedToken || base?.github?.token || ''
    }
  };
}

function buildHeaders() {
  const cfg = getConfig();
  const headers = {
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json'
  };

  if (cfg.github.token) {
    headers.Authorization = `Bearer ${cfg.github.token}`;
  }
  return headers;
}

function buildApi(path = '') {
  const cfg = getConfig();
  return `https://api.github.com/repos/${cfg.github.owner}/${cfg.github.repo}${path}`;
}

function decodeBase64Utf8(b64) {
  const normalized = (b64 || '').replace(/\n/g, '');
  return decodeURIComponent(escape(atob(normalized)));
}

function encodeBase64Utf8(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

async function ensureOk(res, fallbackMessage) {
  if (res.ok) return;
  let msg = fallbackMessage;
  try {
    const data = await res.json();
    msg = data.message || fallbackMessage;
  } catch {}
  throw new Error(msg);
}

export function saveToken(token) {
  sessionStorage.setItem('BLOG_ADMIN_TOKEN', token.trim());
}

export function clearToken() {
  sessionStorage.removeItem('BLOG_ADMIN_TOKEN');
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
    .filter((f) => f.type === 'file' && f.name.toLowerCase().endsWith('.md'))
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

export async function upsertPost({ filename, content, sha }) {
  const cfg = getConfig();
  const safeName = filename.trim();
  if (!safeName || !safeName.endsWith('.md')) {
    throw new Error('文件名必须以 .md 结尾');
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
