# sentin redesign prototype

Local multi-page redesign prototype based on the public content and assets at sentin.ai.

## Included routes

- `/` Homepage
- `/products/` Product overview
- `/explorer/` sentin EXPLORER
- `/asset-collector/` Asset Collector
- `/usecases/` KI and automation use cases
- `/service/` Services
- `/company/` Company
- `/journal/` Inspection Journal
- `/faq/` Frequently asked questions
- `/contact/` Contact

## Run locally

```bash
cd /Users/yemi/sentin-redesign
npm run dev
```

Open http://127.0.0.1:4173.

## Test

```bash
cd /Users/yemi/sentin-redesign
npm test
```

The test suite checks content preservation, heading structure, labels, image loading, intrinsic and rendered image ratios, desktop and mobile overflow, navigation behavior, filtering, and local-only form states across all primary routes.

The contact form is intentionally a prototype. It validates input and demonstrates a success state without transmitting data.
