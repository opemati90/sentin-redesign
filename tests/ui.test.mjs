import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import test from "node:test";
import { chromium } from "playwright";

const projectRoot = new URL("..", import.meta.url).pathname;

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".webp": "image/webp"
};

async function startServer() {
  const server = createServer(async (request, response) => {
    const pathname = new URL(request.url, "http://localhost").pathname;
    if (pathname === "/api/posts") {
      response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      response.end("[]");
      return;
    }
    const relativePath = pathname === "/"
      ? "index.html"
      : pathname.endsWith("/")
        ? `${pathname.slice(1)}index.html`
        : pathname.slice(1);
    const fileUrl = new URL(relativePath, new URL(`file://${projectRoot}/`));

    try {
      const body = await readFile(fileUrl);
      const extension = relativePath.slice(relativePath.lastIndexOf("."));
      response.writeHead(200, { "content-type": contentTypes[extension] ?? "application/octet-stream" });
      response.end(body);
    } catch {
      response.writeHead(404);
      response.end("Not found");
    }
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  return { server, baseUrl: `http://127.0.0.1:${address.port}` };
}

test("homepage works across desktop and mobile", async () => {
  const { server, baseUrl } = await startServer();
  let browser;

  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const pageErrors = [];
    const consoleErrors = [];
    const failedResponses = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("response", (response) => {
      if (response.url().startsWith(baseUrl) && response.status() >= 400) {
        failedResponses.push(`${response.status()} ${response.url()}`);
      }
    });

    await page.goto(baseUrl, { waitUntil: "networkidle" });
    assert.equal(await page.locator("h1").count(), 1);
    assert.equal(await page.locator("h1").isVisible(), true);
    const homepageHeadingLines = await page.locator("h1").evaluate((heading) => {
      const lineHeight = Number.parseFloat(getComputedStyle(heading).lineHeight);
      return heading.getBoundingClientRect().height / lineHeight;
    });
    assert.ok(homepageHeadingLines <= 2.1, `homepage hero uses ${homepageHeadingLines.toFixed(2)} lines`);
    assert.ok((await page.locator(".hero .button").first().boundingBox()).y < 1000);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    assert.deepEqual(pageErrors, []);
    assert.deepEqual(consoleErrors, []);
    assert.deepEqual(failedResponses, []);

    const productsTrigger = page.getByRole("button", { name: "Produkte" });
    await productsTrigger.click();
    assert.equal(await productsTrigger.getAttribute("aria-expanded"), "true");
    assert.equal(await page.locator("#products-menu").isVisible(), true);
    await page.keyboard.press("Escape");
    await page.mouse.move(0, 0);
    assert.equal(await productsTrigger.getAttribute("aria-expanded"), "false");
    assert.equal(await page.locator("#products-menu").isVisible(), false);

    const images = page.locator("img");
    for (let index = 0; index < await images.count(); index += 1) {
      const image = images.nth(index);
      await image.scrollIntoViewIfNeeded();
      await page.waitForTimeout(40);
    }
    await page.waitForTimeout(300);

    const failedImages = await images.evaluateAll((loadedImages) =>
      loadedImages.filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.src)
    );
    assert.deepEqual(failedImages, []);

    const distortedImages = await images.evaluateAll((loadedImages) =>
      loadedImages.flatMap((image) => {
        const box = image.getBoundingClientRect();
        if (!box.width || !box.height || !image.naturalWidth || !image.naturalHeight) return [];
        const fit = getComputedStyle(image).objectFit;
        const naturalRatio = image.naturalWidth / image.naturalHeight;
        const renderedRatio = box.width / box.height;
        const ratioDelta = Math.abs(renderedRatio / naturalRatio - 1);
        const widthAttribute = Number(image.getAttribute("width"));
        const heightAttribute = Number(image.getAttribute("height"));
        const reservedRatio = widthAttribute && heightAttribute ? widthAttribute / heightAttribute : naturalRatio;
        const reservedDelta = Math.abs(reservedRatio / naturalRatio - 1);
        if (reservedDelta > 0.025) {
          return [`${image.src} reserves ${reservedRatio.toFixed(3)} vs ${naturalRatio.toFixed(3)}`];
        }
        return fit === "fill" && ratioDelta > 0.025
          ? [`${image.src} rendered ${renderedRatio.toFixed(3)} vs ${naturalRatio.toFixed(3)}`]
          : [];
      })
    );
    assert.deepEqual(distortedImages, []);

    await page.getByRole("button", { name: "RGB und Daten" }).click();
    assert.equal(await page.locator('[data-category="xray"]:visible').count(), 0);
    assert.ok((await page.locator('[data-category="rgb"]:visible').count()) > 0);

    await page.setViewportSize({ width: 360, height: 780 });
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);

    const menuButton = page.locator("[data-menu-button]");
    assert.equal(await menuButton.getAttribute("aria-label"), "Menü öffnen");
    await menuButton.click();
    assert.equal(await menuButton.getAttribute("aria-expanded"), "true");
    assert.equal(await page.getByRole("navigation", { name: "Mobile Navigation" }).isVisible(), true);
    await page.keyboard.press("Escape");
    assert.equal(await menuButton.getAttribute("aria-expanded"), "false");

    await page.locator("#name").fill("Lokaler Test");
    await page.locator("#email").fill("test@example.com");
    await page.locator("#message").fill("Test der lokalen Formularzustände.");
    await page.locator("#privacy").check();
    await page.getByRole("button", { name: "Gespräch vereinbaren" }).last().click();
    await assert.doesNotReject(async () => {
      await page.getByText("Es wurden keine Daten gesendet.", { exact: false }).waitFor();
    });

  } finally {
    await browser?.close();
    await new Promise((resolve) => server.close(resolve));
  }
});

test("all primary routes render complete undistorted media", async () => {
  const { server, baseUrl } = await startServer();
  const routes = [
    "/products/",
    "/explorer/",
    "/asset-collector/",
    "/usecases/",
    "/service/",
    "/company/",
    "/press/",
    "/jobs/",
    "/journal/",
    "/journal/ki-infrastructure/",
    "/journal/zfp-4-0/",
    "/journal/pacs/",
    "/journal/ki-in-zfp/",
    "/journal/zfp-pruefer/",
    "/journal/geschichte-der-zfp/",
    "/journal/digitale-zwillinge/",
    "/journal/ki-anbieter/",
    "/journal/menschliche-einfluesse/",
    "/journal/schweissnahtarten/",
    "/journal/schweissnahtfehler/",
    "/journal/was-ist-zfp/",
    "/journal/probability-of-detection/",
    "/journal/pseudoausschuss/",
    "/journal/read/?slug=3-fehler-und-katastrophen-in-der-zfp",
    "/faq/",
    "/contact/"
  ];
  let browser;

  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

    for (const route of routes) {
      const errors = [];
      const onPageError = (error) => errors.push(error.message);
      const onConsole = (message) => {
        if (message.type() === "error") errors.push(message.text());
      };
      page.on("pageerror", onPageError);
      page.on("console", onConsole);

      await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
      assert.equal(await page.locator("h1").count(), 1, route);
      assert.equal(await page.locator("h1").isVisible(), true, route);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, route);
      const headingLines = await page.locator("h1").evaluate((heading) => {
        const lineHeight = Number.parseFloat(getComputedStyle(heading).lineHeight);
        return heading.getBoundingClientRect().height / lineHeight;
      });
      const desktopHeadingLimit = ["/service/", "/usecases/"].includes(route) ? 3.1 : 2.1;
      assert.ok(headingLines <= desktopHeadingLimit, `${route} hero uses ${headingLines.toFixed(2)} lines`);
      const heroCtaLocator = page.locator(".page-hero .button").first();
      if (await heroCtaLocator.count()) {
        const heroCta = await heroCtaLocator.boundingBox();
        assert.ok(heroCta && heroCta.y + heroCta.height <= 900, `${route} CTA is below the initial viewport`);
      }
      const wrappedButtons = await page.locator(".button:visible").evaluateAll((buttons) =>
        buttons.flatMap((button) => button.scrollWidth > button.clientWidth + 1 ? [button.textContent.trim()] : [])
      );
      assert.deepEqual(wrappedButtons, [], route);

      const images = page.locator("img");
      for (let index = 0; index < await images.count(); index += 1) {
        await images.nth(index).scrollIntoViewIfNeeded();
        await page.waitForTimeout(25);
      }

      const mediaIssues = await images.evaluateAll((loadedImages) =>
        loadedImages.flatMap((image) => {
          if (!image.complete || image.naturalWidth === 0) return [`not loaded: ${image.src}`];
          const box = image.getBoundingClientRect();
          if (!box.width || !box.height) return [];
          const fit = getComputedStyle(image).objectFit;
          const naturalRatio = image.naturalWidth / image.naturalHeight;
          const renderedRatio = box.width / box.height;
          const ratioDelta = Math.abs(renderedRatio / naturalRatio - 1);
          const widthAttribute = Number(image.getAttribute("width"));
          const heightAttribute = Number(image.getAttribute("height"));
          const reservedRatio = widthAttribute && heightAttribute ? widthAttribute / heightAttribute : naturalRatio;
          const reservedDelta = Math.abs(reservedRatio / naturalRatio - 1);
          if (reservedDelta > 0.025) {
            return [`incorrect intrinsic size: ${image.src} reserves ${reservedRatio.toFixed(3)} vs ${naturalRatio.toFixed(3)}`];
          }
          return fit === "fill" && ratioDelta > 0.025
            ? [`distorted: ${image.src} rendered ${renderedRatio.toFixed(3)} vs ${naturalRatio.toFixed(3)}`]
            : [];
        })
      );

      assert.deepEqual(errors, [], route);
      assert.deepEqual(mediaIssues, [], route);
      page.off("pageerror", onPageError);
      page.off("console", onConsole);
    }

    for (const route of ["/explorer/", "/asset-collector/", "/usecases/", "/contact/"]) {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, route);
    }
  } finally {
    await browser?.close();
    await new Promise((resolve) => server.close(resolve));
  }
});

test("all routes remain usable across the responsive breakpoint matrix", async () => {
  const { server, baseUrl } = await startServer();
  const routes = [
    "/",
    "/products/",
    "/explorer/",
    "/asset-collector/",
    "/usecases/",
    "/service/",
    "/company/",
    "/press/",
    "/jobs/",
    "/journal/",
    "/journal/ki-infrastructure/",
    "/journal/zfp-4-0/",
    "/journal/pacs/",
    "/journal/ki-in-zfp/",
    "/journal/zfp-pruefer/",
    "/journal/geschichte-der-zfp/",
    "/journal/digitale-zwillinge/",
    "/journal/ki-anbieter/",
    "/journal/menschliche-einfluesse/",
    "/journal/schweissnahtarten/",
    "/journal/schweissnahtfehler/",
    "/journal/was-ist-zfp/",
    "/journal/probability-of-detection/",
    "/journal/pseudoausschuss/",
    "/journal/read/?slug=3-fehler-und-katastrophen-in-der-zfp",
    "/faq/",
    "/contact/"
  ];
  const viewports = [
    { width: 320, height: 568 },
    { width: 375, height: 667 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
    { width: 768, height: 900 },
    { width: 820, height: 900 },
    { width: 1024, height: 900 },
    { width: 1440, height: 900 }
  ];
  let browser;

  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);

      for (const route of routes) {
        await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
        const metrics = await page.evaluate(() => {
          const heading = document.querySelector("h1");
          const headingStyle = getComputedStyle(heading);
          const heroButton = document.querySelector(".hero .button, .page-hero .button");
          const header = document.querySelector(".site-header__inner");
          const wrappedButtons = [...document.querySelectorAll(".button")]
            .filter((button) => getComputedStyle(button).display !== "none")
            .filter((button) => button.scrollWidth > button.clientWidth + 1)
            .map((button) => button.textContent.trim());
          const undersizedControls = [...document.querySelectorAll("button, .button, summary")]
            .filter((control) => {
              const box = control.getBoundingClientRect();
              const style = getComputedStyle(control);
              return style.display !== "none" && style.visibility !== "hidden" && box.width > 0 && box.height < 44;
            })
            .map((control) => control.textContent.trim());

          return {
            horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth,
            headingLines: heading.getBoundingClientRect().height / Number.parseFloat(headingStyle.lineHeight),
            heroButtonBottom: heroButton?.getBoundingClientRect().bottom ?? 0,
            headerHeight: header?.getBoundingClientRect().height ?? 0,
            wrappedButtons,
            undersizedControls
          };
        });

        const isArticle = route.startsWith("/journal/") && route !== "/journal/";
        const isLongSourceHero = ["/service/", "/usecases/"].includes(route);
        const headingLimit = route === "/" && viewport.width <= 430
          ? 7.1
          : isLongSourceHero && viewport.width <= 430
            ? 5.1
          : isArticle && viewport.width <= 430
              ? 5.1
              : viewport.width <= 430
                ? 3.1
                : route === "/" && viewport.width <= 900
                  ? 5.1
                  : (isArticle || isLongSourceHero) && viewport.width <= 900
                    ? 3.1
                    : route === "/" && viewport.width <= 1080
                      ? 3.1
                    : isLongSourceHero
                      ? 3.1
                      : 2.1;
        assert.ok(metrics.horizontalOverflow <= 0, `${route} overflows at ${viewport.width}px`);
        assert.ok(metrics.headingLines <= headingLimit, `${route} heading uses ${metrics.headingLines.toFixed(2)} lines at ${viewport.width}px`);
        assert.ok(metrics.heroButtonBottom <= viewport.height, `${route} hero CTA is below ${viewport.height}px`);
        assert.ok(metrics.headerHeight <= 80, `${route} header is ${metrics.headerHeight}px tall`);
        assert.deepEqual(metrics.wrappedButtons, [], `${route} wraps a CTA at ${viewport.width}px`);
        assert.deepEqual(metrics.undersizedControls, [], `${route} has a short control at ${viewport.width}px`);
      }
    }

    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await page.locator("[data-menu-button]").click();
    const menuLinks = page.locator("[data-mobile-menu] a");
    assert.equal(await menuLinks.count(), 15);
    for (let index = 0; index < await menuLinks.count(); index += 1) {
      assert.ok((await menuLinks.nth(index).boundingBox()).height >= 44);
    }
    await menuLinks.last().scrollIntoViewIfNeeded();
    assert.equal(await menuLinks.last().isVisible(), true);
  } finally {
    await browser?.close();
    await new Promise((resolve) => server.close(resolve));
  }
});
