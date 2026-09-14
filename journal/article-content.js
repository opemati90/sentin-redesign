const articleBody = document.querySelector("[data-article-body]");
const livePageBody = document.querySelector("[data-live-page]");

const articleRoutes = {
  "guide-ki-faehige-zfp-infrastruktur": "/journal/ki-infrastructure/",
  "der-zfp-4-0-guide-alles-was-sie-wissen-muessen": "/journal/zfp-4-0/",
  "was-ist-ein-pacs-zfp": "/journal/pacs/",
  "ki-in-zfp": "/journal/ki-in-zfp/",
  "ein-tag-als-zfp-pruefer-arbeit-und-leben-in-der-zfp": "/journal/zfp-pruefer/",
  "die-geschichte-der-zfp-5-interessante-fakten": "/journal/geschichte-der-zfp/",
  "3-fakten-ueber-digitale-zwillinge-fuer-pipelines": "/journal/digitale-zwillinge/",
  "beste-ki-ai-anbieter-agentur-dienstleister-finden": "/journal/ki-anbieter/",
  "interview-marija-bertovic-ueber-zfp-4-0-und-kuenstliche-intelligenz-teil-2": "/journal/menschliche-einfluesse/",
  "diese-11-arten-von-schweissnaehten-sollte-man-kennen": "/journal/schweissnahtarten/",
  "10-haeufige-schweissnaht-fehler": "/journal/schweissnahtfehler/",
  "5-arten-was-ist-zerstoerungsfreie-pruefung-zfp": "/journal/was-ist-zfp/",
  "was-ist-die-probability-of-detection-pod-in-der-zfp": "/journal/probability-of-detection/",
  "pseudoausschuss-und-schlupf": "/journal/pseudoausschuss/"
};

const pageRoutes = new Map([
  ["/", "/"],
  ["/explorer/", "/explorer/"],
  ["/asset-collector/", "/asset-collector/"],
  ["/usecases/", "/usecases/"],
  ["/service/", "/service/"],
  ["/journal/", "/journal/"],
  ["/jobs/", "/jobs/"],
  ["/press/", "/press/"],
  ["/faq/", "/faq/"],
  ["/contact/", "/contact/"]
]);

function decodeText(value = "") {
  const documentFragment = new DOMParser().parseFromString(value, "text/html");
  return documentFragment.body.textContent.replace(/\s+/g, " ").replace(/\[…\]|…$/, "").trim();
}

function localArticleHref(url) {
  const parsed = new URL(url, "https://sentin.ai/");
  if (parsed.hostname !== "sentin.ai" && parsed.hostname !== "www.sentin.ai") return null;
  if (parsed.pathname.startsWith("/en/")) return null;
  const normalizedPath = parsed.pathname === "/" || parsed.pathname.endsWith("/") ? parsed.pathname : `${parsed.pathname}/`;
  if (pageRoutes.has(normalizedPath)) return pageRoutes.get(normalizedPath);
  if (parsed.pathname.startsWith("/download/") || parsed.pathname.startsWith("/wp-content/")) return parsed.href;

  const slug = parsed.pathname.split("/").filter(Boolean).at(-1);
  if (!slug || slug === "en") return "/journal/";
  return articleRoutes[slug] ?? `/journal/read/?slug=${encodeURIComponent(slug)}`;
}

function sanitizeArticle(markup) {
  const parsed = new DOMParser().parseFromString(markup, "text/html");
  const root = parsed.body;
  const removeSelectors = [
    "script", "style", "iframe", "form", "noscript", ".elementor-widget-spacer",
    ".elementor-widget-table-of-contents", ".elementor-widget-button", ".elementor-widget-video",
    ".sharedaddy", ".jp-relatedposts"
  ];
  root.querySelectorAll(removeSelectors.join(",")).forEach((element) => element.remove());

  root.querySelectorAll(".gallery").forEach((gallery) => {
    const items = [...gallery.children].filter((child) => child.tagName === "FIGURE");
    if (!items.length) return;
    const replacement = parsed.createElement("div");
    replacement.className = "source-gallery";
    replacement.append(...items);
    gallery.replaceWith(replacement);
  });

  const allowedTags = new Set([
    "A", "BLOCKQUOTE", "BR", "CODE", "EM", "FIGCAPTION", "FIGURE", "H2", "H3", "H4", "H5",
    "HR", "IMG", "LI", "OL", "P", "PRE", "STRONG", "SUB", "SUP", "TABLE", "TBODY", "TD", "TH", "THEAD", "TR", "UL"
  ]);

  [...root.querySelectorAll("*")].forEach((node) => {
    let element = node;
    const isSourceGallery = element.tagName === "DIV" && element.classList.contains("source-gallery");
    if (element.tagName === "H1") {
      const replacement = parsed.createElement("h2");
      replacement.innerHTML = element.innerHTML;
      element.replaceWith(replacement);
      element = replacement;
    }

    if (!allowedTags.has(element.tagName) && !isSourceGallery) {
      element.replaceWith(...element.childNodes);
      return;
    }

    [...element.attributes].forEach((attribute) => {
      const isAllowed = ["alt", "height", "href", "src", "srcset", "title", "width"].includes(attribute.name)
        || (isSourceGallery && attribute.name === "class");
      if (!isAllowed) {
        element.removeAttribute(attribute.name);
      }
    });

    if (element.tagName === "IMG") {
      const source = element.getAttribute("src");
      if (!source) {
        element.remove();
        return;
      }
      element.src = new URL(source, "https://sentin.ai/").href;
      element.loading = "lazy";
      element.decoding = "async";
      if (!element.alt) element.alt = "Abbildung aus dem sentin Fachartikel";
    }

    if (element.tagName === "A") {
      const href = element.getAttribute("href");
      if (!href) return;
      const localHref = localArticleHref(href);
      if (localHref) {
        element.href = localHref;
      } else {
        element.href = new URL(href, "https://sentin.ai/").href;
        element.target = "_blank";
        element.rel = "noopener noreferrer";
      }
    }
  });

  root.querySelectorAll("h2, h3").forEach((heading, index) => {
    heading.id = `section-${index + 1}`;
  });
  root.querySelectorAll("p").forEach((paragraph) => {
    if (!paragraph.textContent.trim() && !paragraph.querySelector("img")) paragraph.remove();
  });

  return root.innerHTML;
}

async function loadArticle() {
  if (!articleBody) return;

  const routeKey = document.body.dataset.article;
  const querySlug = new URLSearchParams(window.location.search).get("slug");
  const slugByRoute = {
    "ki-infrastructure": "guide-ki-faehige-zfp-infrastruktur",
    "zfp-4-0": "der-zfp-4-0-guide-alles-was-sie-wissen-muessen",
    pacs: "was-ist-ein-pacs-zfp",
    "ki-in-zfp": "ki-in-zfp",
    "zfp-pruefer": "ein-tag-als-zfp-pruefer-arbeit-und-leben-in-der-zfp",
    "geschichte-der-zfp": "die-geschichte-der-zfp-5-interessante-fakten",
    "digitale-zwillinge": "3-fakten-ueber-digitale-zwillinge-fuer-pipelines",
    "ki-anbieter": "beste-ki-ai-anbieter-agentur-dienstleister-finden",
    "menschliche-einfluesse": "interview-marija-bertovic-ueber-zfp-4-0-und-kuenstliche-intelligenz-teil-2",
    schweissnahtarten: "diese-11-arten-von-schweissnaehten-sollte-man-kennen",
    schweissnahtfehler: "10-haeufige-schweissnaht-fehler",
    "was-ist-zfp": "5-arten-was-ist-zerstoerungsfreie-pruefung-zfp",
    "probability-of-detection": "was-ist-die-probability-of-detection-pod-in-der-zfp",
    pseudoausschuss: "pseudoausschuss-und-schlupf"
  };
  const slug = querySlug || slugByRoute[routeKey];
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) return;

  articleBody.setAttribute("aria-busy", "true");
  articleBody.innerHTML = '<p class="article-loading">Originalbeitrag wird geladen…</p>';

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12000);

  try {
    const endpoint = `/api/posts?slug=${encodeURIComponent(slug)}`;
    const response = await fetch(endpoint, { credentials: "omit", signal: controller.signal });
    if (!response.ok) throw new Error("Article request failed");
    const [post] = await response.json();
    if (!post) throw new Error("Article not found");

    const title = decodeText(post.title.rendered);
    const excerpt = decodeText(post.excerpt.rendered);
    const bodyMarkup = sanitizeArticle(post.content.rendered);
    const titleElement = document.querySelector(".article-hero h1");
    const deckElement = document.querySelector(".article-deck");
    const metaElement = document.querySelector(".article-meta");
    const wordCount = decodeText(post.content.rendered).split(/\s+/).filter(Boolean).length;
    const date = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "long", year: "numeric" }).format(new Date(post.date));

    if (titleElement) titleElement.textContent = title;
    if (deckElement) deckElement.remove();
    if (metaElement) metaElement.textContent = `${date} · ${Math.max(3, Math.ceil(wordCount / 180))} Minuten Lesezeit`;
    document.title = `${title} | sentin`;
    articleBody.innerHTML = `<div class="wp-article-content">${bodyMarkup}</div>`;
    articleBody.classList.add("is-loaded");
  } catch {
    articleBody.innerHTML = `<div class="article-error"><h2>Der Beitrag konnte gerade nicht geladen werden.</h2><p>Die Originalinhalte bleiben unverändert bei sentin verfügbar.</p><a class="button button--navy" href="https://sentin.ai/${encodeURIComponent(slug)}/">Originalbeitrag öffnen</a></div>`;
  } finally {
    window.clearTimeout(timeout);
    articleBody.removeAttribute("aria-busy");
  }
}

loadArticle();

async function loadLivePage() {
  if (!livePageBody) return;
  const slug = document.body.dataset.sourcePage;
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) return;

  livePageBody.setAttribute("aria-busy", "true");
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(`/api/posts?type=pages&slug=${encodeURIComponent(slug)}`, { credentials: "same-origin", signal: controller.signal });
    if (!response.ok) throw new Error("Page request failed");
    const [pageData] = await response.json();
    if (!pageData) throw new Error("Page not found");

    livePageBody.innerHTML = `<div class="wp-article-content live-page-content">${sanitizeArticle(pageData.content.rendered)}</div>`;
    const firstHeading = livePageBody.querySelector("h2");
    const pageHeading = document.querySelector(".page-hero h1")?.textContent.trim();
    if (firstHeading?.textContent.trim() === pageHeading) firstHeading.remove();
    livePageBody.classList.add("is-loaded");
  } catch {
    livePageBody.innerHTML = `<div class="article-error"><h2>Die Inhalte konnten gerade nicht geladen werden.</h2><p>Die Originalseite bleibt bei sentin verfügbar.</p><a class="button button--navy" href="https://sentin.ai/${encodeURIComponent(slug)}/">Originalseite öffnen</a></div>`;
  } finally {
    window.clearTimeout(timeout);
    livePageBody.removeAttribute("aria-busy");
  }
}

loadLivePage();
