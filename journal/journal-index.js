const journalFeed = document.querySelector("[data-journal-feed]");
const loadMoreButton = document.querySelector("[data-load-more]");

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

function decodeText(value = "") {
  const parsed = new DOMParser().parseFromString(value, "text/html");
  return parsed.body.textContent.replace(/\s+/g, " ").replace(/\[…\]|…$/, "").trim();
}

function internalHref(slug) {
  return articleRoutes[slug] ?? `/journal/read/?slug=${encodeURIComponent(slug)}`;
}

function clipText(value, limit = 230) {
  if (value.length <= limit) return value;
  const clipped = value.slice(0, limit).replace(/\s+\S*$/, "").replace(/[,:;\s]+$/, "");
  return `${clipped}…`;
}

function renderPost(post) {
  const title = decodeText(post.title.rendered);
  const excerpt = clipText(decodeText(post.excerpt.rendered));
  const date = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "long", year: "numeric" }).format(new Date(post.date));
  const href = internalHref(post.slug);
  return `<article class="journal-card"><time datetime="${post.date.slice(0, 10)}">${date}</time><h2><a href="${href}">${title}</a></h2><p>${excerpt}</p><a class="text-link" href="${href}">Weiterlesen</a></article>`;
}

async function loadJournal() {
  if (!journalFeed) return;

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch("/api/posts?per_page=100", { credentials: "same-origin", signal: controller.signal });
    if (!response.ok) throw new Error("Journal request failed");
    const posts = (await response.json()).filter((post) => !new URL(post.link).pathname.startsWith("/en/"));
    let visibleCount = 10;

    const render = () => {
      journalFeed.innerHTML = posts.slice(0, visibleCount).map(renderPost).join("");
      if (loadMoreButton) loadMoreButton.hidden = visibleCount >= posts.length;
    };

    loadMoreButton?.addEventListener("click", () => {
      const firstNewIndex = visibleCount;
      visibleCount += 10;
      render();
      journalFeed.querySelectorAll(".journal-card")[firstNewIndex]?.querySelector("a")?.focus();
    });
    render();
  } catch {
    if (loadMoreButton) loadMoreButton.hidden = true;
  } finally {
    window.clearTimeout(timeout);
  }
}

loadJournal();
