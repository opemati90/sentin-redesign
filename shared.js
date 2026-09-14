const page = document.body.dataset.page ?? "";
const productPages = new Set(["products", "explorer", "asset-collector", "usecases"]);
const servicePages = new Set(["service", "service-ai", "service-software", "service-infrastructure"]);
const companyPages = new Set(["company", "press", "jobs", "faq"]);

function current(name) {
  if (name === "products" && productPages.has(page)) return ' aria-current="page"';
  if (name === "service" && servicePages.has(page)) return ' aria-current="page"';
  if (name === "company" && companyPages.has(page)) return ' aria-current="page"';
  return page === name ? ' aria-current="page"' : "";
}

const header = document.querySelector("[data-shared-header]");

if (header) {
  header.outerHTML = `
    <header class="site-header" data-site-header>
      <div class="site-header__inner shell">
        <a class="brand" href="/" aria-label="sentin Startseite">
          <img src="/assets/sentin-logo-white.png" alt="sentin" width="160" height="60" />
        </a>
        <nav class="desktop-nav" aria-label="Hauptnavigation">
          <a class="nav-link" href="/"${current("home")}>Home</a>
          <div class="nav-group" data-nav-group>
            <button class="nav-trigger" type="button" aria-expanded="false" aria-controls="products-menu" data-nav-trigger${current("products")}>
              Produkte <span class="nav-chevron" aria-hidden="true"></span>
            </button>
            <div class="nav-dropdown" id="products-menu">
              <a href="/products/"><strong>Produktübersicht</strong><span>Der digitale Prüfprozess im Ganzen</span></a>
              <a href="/explorer/"><strong>sentin EXPLORER</strong><span>Bildauswertung und KI-Integration</span></a>
              <a href="/asset-collector/"><strong>Asset Collector</strong><span>Digitale Typenschild-Erfassung</span></a>
              <a href="/usecases/"><strong>KI-Modelle und Anwendungsfälle</strong><span>Modelle für konkrete Prüfaufgaben</span></a>
            </div>
          </div>
          <div class="nav-group" data-nav-group>
            <button class="nav-trigger" type="button" aria-expanded="false" aria-controls="services-menu" data-nav-trigger${current("service")}>
              Services <span class="nav-chevron" aria-hidden="true"></span>
            </button>
            <div class="nav-dropdown nav-dropdown--wide" id="services-menu">
              <a href="/service/"><strong>Serviceübersicht</strong><span>Von der Analyse bis zum Betrieb</span></a>
              <a href="/service/#ai"><strong>Künstliche Intelligenz</strong><span>Daten, Modelle, Validierung und Monitoring</span></a>
              <a href="/service/#software"><strong>Fullstack Softwareentwicklung</strong><span>Prüfwerkzeuge und Integrationen</span></a>
              <a href="/service/#infrastructure"><strong>Digitale ZfP-Infrastruktur</strong><span>PACS, Cloud, Server und Maschinen</span></a>
            </div>
          </div>
          <div class="nav-group" data-nav-group>
            <button class="nav-trigger" type="button" aria-expanded="false" aria-controls="company-menu" data-nav-trigger${current("company")}>
              Unternehmen <span class="nav-chevron" aria-hidden="true"></span>
            </button>
            <div class="nav-dropdown" id="company-menu">
              <a href="/company/"><strong>Über sentin</strong><span>Herkunft, Team und Anspruch</span></a>
              <a href="/press/"><strong>Presse und PR</strong><span>Veröffentlichungen und Medienkontakt</span></a>
              <a href="/jobs/"><strong>Jobs</strong><span>Offene Rollen und Initiativbewerbung</span></a>
              <a href="/faq/"><strong>FAQ</strong><span>Antworten vor dem Projektstart</span></a>
            </div>
          </div>
          <a class="nav-link" href="/journal/"${current("journal")}>Blog</a>
        </nav>
        <div class="header-actions">
          <a class="language-link" href="https://sentin.ai/en/home-en/" lang="en">EN</a>
          <a class="button button--light button--compact desktop-cta" href="/contact/">Gespräch vereinbaren</a>
          <button class="menu-button" type="button" aria-label="Menü öffnen" aria-expanded="false" aria-controls="mobile-menu" data-menu-button>
            <span></span><span></span>
          </button>
        </div>
      </div>
      <nav class="mobile-menu" id="mobile-menu" aria-label="Mobile Navigation" data-mobile-menu hidden>
        <a class="mobile-menu__primary" href="/">Home</a>
        <div class="mobile-menu__group">
          <p>Produkte</p>
          <a href="/products/">Übersicht</a>
          <a href="/explorer/">sentin EXPLORER</a>
          <a href="/asset-collector/">Asset Collector</a>
          <a href="/usecases/">Anwendungsfälle</a>
        </div>
        <div class="mobile-menu__group">
          <p>Services</p>
          <a href="/service/">Übersicht</a>
          <a href="/service/#ai">Künstliche Intelligenz</a>
          <a href="/service/#software">Softwareentwicklung</a>
          <a href="/service/#infrastructure">ZfP-Infrastruktur</a>
        </div>
        <div class="mobile-menu__group">
          <p>Unternehmen</p>
          <a href="/company/">Über sentin</a>
          <a href="/press/">Presse und PR</a>
          <a href="/jobs/">Jobs</a>
          <a href="/faq/">FAQ</a>
        </div>
        <a class="mobile-menu__primary" href="/journal/">Blog</a>
        <a class="mobile-menu__primary" href="/contact/">Kontakt</a>
      </nav>
    </header>`;
}

const footer = document.querySelector("[data-shared-footer]");

if (footer) {
  footer.outerHTML = `
    <footer class="site-footer">
      <div class="shell footer-grid">
        <div class="footer-brand">
          <img src="/assets/sentin-logo-white.png" alt="sentin" width="160" height="60" loading="lazy" />
          <p>Kontrolle ist gut. Wir machen sie besser.</p>
          <div class="footer-contact">
            <a href="mailto:contact@sentin.ai">contact@sentin.ai</a>
            <a href="tel:+4923454506170">+49 234 54506170</a>
          </div>
        </div>
        <div>
          <h2>Seiten</h2>
          <a href="/products/">Produkte</a>
          <a href="/service/">Services</a>
          <a href="/service/#ai">KI-Services</a>
          <a href="/service/#software">Softwareentwicklung</a>
          <a href="/service/#infrastructure">ZfP-Infrastruktur</a>
          <a href="/usecases/">Anwendungsfälle</a>
          <a href="/company/">Über sentin</a>
          <a href="/press/">Presse und PR</a>
          <a href="/jobs/">Jobs</a>
          <a href="/journal/">Blog</a>
          <a href="/faq/">FAQ</a>
          <a href="/contact/">Kontakt</a>
        </div>
        <div>
          <h2>Technik und Theorie</h2>
          <a href="/journal/schweissnahtarten/">Die 11 Schweißnahtarten</a>
          <a href="/journal/schweissnahtfehler/">Die 10 häufigsten Schweißnahtfehler</a>
          <a href="/journal/was-ist-zfp/">Die 5 Arten der ZfP</a>
          <a href="/journal/probability-of-detection/">Probability of Detection</a>
          <a href="/journal/menschliche-einfluesse/">Menschliche Einflüsse in der ZfP</a>
          <a href="/journal/pseudoausschuss/">Pseudoausschuss und Schlupf</a>
        </div>
        <div>
          <h2>Digitales</h2>
          <a href="/journal/zfp-4-0/">Der ZfP 4.0 Guide</a>
          <a href="/journal/ki-infrastructure/">KI-fähige ZfP-Infrastruktur</a>
          <a href="/journal/pacs/">Digitale Archive und PACS</a>
          <a href="/journal/ki-in-zfp/">Wie KI in der ZfP funktioniert</a>
          <a href="/journal/ki-anbieter/">Den passenden KI-Anbieter finden</a>
          <a class="tisax-link" href="https://portal.enx.com/de-de/TISAX/">
            <img src="/assets/tisax.png" alt="TISAX Assessment" width="150" height="76" loading="lazy" />
          </a>
        </div>
      </div>
      <div class="shell footer-bottom">
        <p>© 2026 sentin GmbH</p>
        <div>
          <a href="https://sentin.ai/imprint/">Impressum</a>
          <a href="https://sentin.ai/datasecurity/">Datenschutz</a>
          <a href="https://www.linkedin.com/company/sentin">LinkedIn</a>
        </div>
      </div>
    </footer>`;
}
