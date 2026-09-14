import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.SENTIN_PORT ?? 4173);
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".webp": "image/webp"
};

async function proxyPosts(requestUrl, response) {
  const slug = requestUrl.searchParams.get("slug");
  const contentType = requestUrl.searchParams.get("type") === "pages" ? "pages" : "posts";
  const requestedCount = Number(requestUrl.searchParams.get("per_page") ?? 10);
  const perPage = Math.min(100, Math.max(1, Number.isFinite(requestedCount) ? requestedCount : 10));
  if (slug && !/^[a-z0-9-]+$/.test(slug)) {
    response.writeHead(400, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: "Invalid article slug" }));
    return;
  }

  const sourceUrl = new URL(`https://sentin.ai/wp-json/wp/v2/${contentType}`);
  sourceUrl.searchParams.set("per_page", String(slug ? 1 : perPage));
  sourceUrl.searchParams.set("_fields", slug ? "slug,link,title,date,excerpt,content" : "slug,link,title,date,excerpt");
  if (slug) sourceUrl.searchParams.set("slug", slug);

  try {
    const upstream = await fetch(sourceUrl, { headers: { accept: "application/json", "user-agent": "sentin-redesign-local/1.0" } });
    response.writeHead(upstream.status, { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=300" });
    response.end(await upstream.text());
  } catch {
    response.writeHead(502, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: "The sentin content source is temporarily unavailable" }));
  }
}

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  if (requestUrl.pathname === "/api/posts") {
    await proxyPosts(requestUrl, response);
    return;
  }

  const relativePath = requestUrl.pathname === "/"
    ? "index.html"
    : requestUrl.pathname.endsWith("/")
      ? `${requestUrl.pathname.slice(1)}index.html`
      : requestUrl.pathname.slice(1);
  const safePath = normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = join(projectRoot, safePath);

  if (!filePath.startsWith(projectRoot)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const body = await readFile(filePath);
    response.writeHead(200, { "content-type": contentTypes[extname(filePath)] ?? "application/octet-stream" });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
});

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`sentin redesign available at http://127.0.0.1:${port}\n`);
});
