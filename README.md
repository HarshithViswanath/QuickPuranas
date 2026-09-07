  Quick Puranas — Multi-Angle Knowledge Tool
> A fast, distraction-free search and contextual learning tool designed for curious minds who want quick, multi-angle context on any topic — powered by live Wikipedia APIs. Built with **pure HTML, CSS, and Vanilla JavaScript** (no frameworks, no build tools).
---
##  Features
- Debounced Live Search Suggestions: As you type, real-time autocomplete suggestions are fetched using Wikipedia's OpenSearch API (`action=opensearch&origin=*`). Debounced by 350ms to minimize unnecessary network calls.
- Short Summary Card: Concise overview paragraph extracted from Wikipedia's REST Summary API (`/page/summary/{title}`), with key term bolding and thumbnail support.
- Key Takeaways / Facts Extractor: Automatically parses summary paragraphs into 3–5 clean, bite-sized factual bullet points using regular expression sentence splitting.
- Related Topics Grid: Displays 3–4 related Wikipedia pages powered by MediaWiki Action Search Generator. Clicking any card instantly searches that new topic!
- Reading Time Estimator: Displays estimated reading time (`~1 min read`) based on word count.
- Search History: Keeps track of your last 5 searched topics using browser `localStorage` for fast re-access.
- Disambiguation & Error Handling: Gracefully handles topics with multiple meanings, 404s, and network errors with clear status banners.
---
## Tech Stack & Constraints
- HTML5**: Semantic elements (`<header>`, `<main>`, `<article>`, `<section>`, `<footer>`) with ARIA accessibility roles.
- CSS3**: Modern custom properties (variables), Flexbox, CSS Grid layout, custom typography (`Inter` & `Lora`), skeleton loading animations, and responsive breakpoints.
- Vanilla JavaScript (ES6+): `async/await`, Fetch API, DOM manipulation, custom `debounce` utility, Regex string manipulation, and `localStorage`.
- APIs**:
  - Wikipedia OpenSearch API: `https://en.wikipedia.org/w/api.php?action=opensearch&format=json&origin=*`
  - Wikipedia REST Summary API: `https://en.wikipedia.org/api/rest_v1/page/summary/{title}`
  - MediaWiki Action Search Generator: `https://en.wikipedia.org/w/api.php?action=query&generator=search&origin=*`
---
##  Project Structure
```text
QuickPuranas/
├── index.html     # Semantic HTML markup & component structure
├── style.css      # Custom styling, typography, cards grid & responsiveness
├── script.js       # App logic (Debounce, Wikipedia APIs, key facts, localStorage)
└── README.md      # Documentation & setup guide
```
---
