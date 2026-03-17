export async function onRequest(context) {
  const token = context.env.GITHUB_TOKEN;
  if (!token) {
    return json({ message: 'Missing GITHUB_TOKEN environment variable.' }, 500);
  }

  const path = Array.isArray(context.params.path) ? context.params.path.join('/') : String(context.params.path || '');
  if (!path) {
    return json({ message: 'Missing GitHub API path.' }, 400);
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
