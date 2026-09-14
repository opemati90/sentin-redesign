import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const routeFiles = [
  "index.html",
  "products/index.html",
  "explorer/index.html",
  "asset-collector/index.html",
  "usecases/index.html",
  "service/index.html",
  "service/ai/index.html",
  "service/software/index.html",
  "service/infrastructure/index.html",
  "company/index.html",
  "press/index.html",
  "jobs/index.html",
  "journal/index.html",
  "journal/ki-infrastructure/index.html",
  "journal/zfp-4-0/index.html",
  "journal/pacs/index.html",
  "journal/ki-in-zfp/index.html",
  "journal/zfp-pruefer/index.html",
  "journal/geschichte-der-zfp/index.html",
  "journal/digitale-zwillinge/index.html",
  "journal/ki-anbieter/index.html",
  "journal/menschliche-einfluesse/index.html",
  "journal/schweissnahtarten/index.html",
  "journal/schweissnahtfehler/index.html",
  "journal/was-ist-zfp/index.html",
  "journal/probability-of-detection/index.html",
  "journal/pseudoausschuss/index.html",
  "journal/read/index.html",
  "faq/index.html",
  "contact/index.html"
];
const pages = await Promise.all(
  routeFiles.map(async (path) => ({ path, html: await readFile(new URL(`../${path}`, import.meta.url), "utf8") }))
);
const html = pages[0].html;
const allHtml = pages.map((page) => page.html).join("\n");
const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
const subpageCss = await readFile(new URL("../subpages.css", import.meta.url), "utf8");
const script = await readFile(new URL("../script.js", import.meta.url), "utf8");
const shared = await readFile(new URL("../shared.js", import.meta.url), "utf8");
const articleScript = await readFile(new URL("../journal/article-content.js", import.meta.url), "utf8");

test("uses one clear page heading on every route", () => {
  pages.forEach((page) => {
    const headings = page.html.match(/<h1\b/g) ?? [];
    assert.equal(headings.length, 1, page.path);
  });
});

test("keeps the approved homepage hero copy verbatim", () => {
  assert.match(html, /Automation and artificial intelligence/);
  assert.match(html, /for non-destructive testing and industrial inspections\./);
  assert.match(html, /We believe that digital transformation and technologies like AI are key to achieving this goal, as they combine the knowledge of many auditors and can make decisions in less than a second\./);
});

test("preserves core products, proof, use cases, and resources", () => {
  const requiredCopy = [
    "sentin EXPLORER",
    "Asset Collector",
    "94,4 % schneller",
    "Restwanddicke und Korrosion",
    "Schweißnahtfehler im Feld",
    "Inline-Fehlererkennung",
    "Bildqualität verbessern",
    "OCR und Texterkennung",
    "Inline-Oberflächeninspektion",
    "Drohneninspektion",
    "Inspektionsdaten anonymisieren",
    "150.000 Euro pro Jahr",
    "Dr. Uwe Ewert",
    "TISAX Assessment",
    "Checkliste mit 24 Fragen"
  ];

  requiredCopy.forEach((copy) => assert.ok(allHtml.includes(copy), `missing: ${copy}`));
});

test("keeps established routes and conversion destinations", () => {
  const requiredLinks = [
    "/explorer/",
    "/asset-collector/",
    "/usecases/",
    "/service/",
    "/service/#ai",
    "/service/#software",
    "/service/#infrastructure",
    "/company/",
    "/press/",
    "/jobs/",
    "/journal/",
    "/journal/ki-infrastructure/",
    "/journal/was-ist-zfp/",
    "/faq/",
    "/contact/",
    "https://sentin.ai/datasecurity/"
  ];

  requiredLinks.forEach((href) => {
    const source = href.startsWith("/") ? `${allHtml}\n${shared}` : `${allHtml}\n${shared}`;
    assert.ok(source.includes(`href="${href}"`), `missing link: ${href}`);
  });
});

test("uses the official sentin content source for complete articles and long-form pages", () => {
  assert.match(articleScript, /\/api\/posts\?slug=/);
  assert.match(articleScript, /type=pages/);
  assert.match(articleScript, /sanitizeArticle/);
  assert.match(allHtml, /data-source-page="press"/);
  assert.match(allHtml, /data-source-page="jobs"/);
  assert.match(allHtml, /data-source-page="awards"/);
  assert.match(allHtml, /data-source-page="faq"/);
  assert.match(allHtml, /Der ZfP 4\.0 Guide – Alles, was Sie wissen müssen\./);
  assert.match(allHtml, /3 Fehler und Katastrophen in der ZfP/);
});

test("gives every static image an alt attribute", () => {
  const images = `${allHtml}\n${shared}`.match(/<img\b[^>]*>/g) ?? [];
  assert.ok(images.length >= 40);
  images.forEach((image) => assert.match(image, /\balt="[^"]*"/));
});

test("keeps contact labels associated with their controls", () => {
  ["name", "email", "message", "product", "privacy"].forEach((id) => {
    assert.ok(html.includes(`for="${id}"`), `missing label for ${id}`);
    assert.ok(html.includes(`id="${id}"`), `missing control ${id}`);
  });
});

test("uses stable viewport and efficient animation patterns", () => {
  assert.doesNotMatch(`${css}\n${subpageCss}`, /h-screen/);
  assert.match(`${css}\n${subpageCss}`, /100dvh/);
  assert.doesNotMatch(script, /addEventListener\(["']scroll/);
  assert.match(script, /IntersectionObserver/);
  assert.match(css, /prefers-reduced-motion/);
});

test("defines an explicit non-distorting media policy", () => {
  const styles = `${css}\n${subpageCss}`;
  assert.match(styles, /img\s*\{[\s\S]*?height:\s*auto/);
  assert.match(styles, /object-fit:\s*contain/);
  assert.doesNotMatch(styles, /object-fit:\s*fill/);
});
