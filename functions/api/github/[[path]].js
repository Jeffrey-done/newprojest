export async function onRequest(context) {
  const allowedMethods = new Set(['GET', 'HEAD', 'PUT', 'DELETE']);
  if (!allowedMethods.has(context.request.method)) {
    return json({ message: `Method ${context.request.method} not allowed.` }, 405);
  }

  const token = context.env.GITHUB_TOKEN;
  if (!token) {
    return json({ message: 'Missing GITHUB_TOKEN environment variable.' }, 500);
  }

  const path = Array.isArray(context.params.path) ? context.params.path.join('/') : String(context.params.path || '');
  if (!path) {
    return json({ message: 'Missing GitHub API path.' }, 400);
  }

  const m = path.match(/^repos\/([^/]+)\/([^/]+)\/contents(\/.*)?$/);
  if (!m) {
    return json({ message: 'Only repos/{owner}/{repo}/contents/* paths are allowed.' }, 403);
  }

  const requestOwner = m[1];
  const requestRepo = m[2];
  const expectedOwner = String(context.env.GITHUB_OWNER || '').trim();
  const expectedRepo = String(context.env.GITHUB_REPO || '').trim();
  if (expectedOwner && requestOwner !== expectedOwner) {
    return json({ message: `Owner mismatch: expected ${expectedOwner}.` }, 403);
  }
  if (expectedRepo && requestRepo !== expectedRepo) {
    return json({ message: `Repo mismatch: expected ${expectedRepo}.` }, 403);
  }

  const githubUrl = `https://api.github.com/${path}${new URL(context.request.url).search}`;
  const incomingBody = ['GET', 'HEAD'].includes(context.request.method)
    ? undefined
    : await context.request.text();

  const headers = new Headers({
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    Authorization: token.startsWith('gh') ? `token ${token}` : `Bearer ${token}`,
    'User-Agent': 'gblog-proxy'
  });

  const ghRes = await fetch(githubUrl, {
    method: context.request.method,
    headers,
    body: incomingBody
  });

  const responseHeaders = new Headers({
    'Content-Type': ghRes.headers.get('Content-Type') || 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });

  return new Response(ghRes.body, {
    status: ghRes.status,
    statusText: ghRes.statusText,
    headers: responseHeaders
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}
