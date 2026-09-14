export default async function handler(request, response) {
  const requestUrl = new URL(request.url, "http://localhost");
  const slug = requestUrl.searchParams.get("slug");
  const contentType = requestUrl.searchParams.get("type") === "pages" ? "pages" : "posts";
  const requestedCount = Number(requestUrl.searchParams.get("per_page") ?? 10);
  const perPage = Math.min(100, Math.max(1, Number.isFinite(requestedCount) ? requestedCount : 10));

  if (slug && !/^[a-z0-9-]+$/.test(slug)) {
    response.status(400).json({ error: "Invalid article slug" });
    return;
  }

  const sourceUrl = new URL(`https://sentin.ai/wp-json/wp/v2/${contentType}`);
  sourceUrl.searchParams.set("per_page", String(slug ? 1 : perPage));
  sourceUrl.searchParams.set("_fields", slug ? "slug,link,title,date,excerpt,content" : "slug,link,title,date,excerpt");
  if (slug) sourceUrl.searchParams.set("slug", slug);

  try {
    const upstream = await fetch(sourceUrl, {
      headers: { accept: "application/json", "user-agent": "sentin-redesign/1.0" }
    });
    const payload = await upstream.text();
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=86400");
    response.status(upstream.status).send(payload);
  } catch {
    response.status(502).json({ error: "The sentin content source is temporarily unavailable" });
  }
}
