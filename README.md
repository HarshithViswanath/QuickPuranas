<<<<<<< HEAD
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
=======
# Quick Puranas — Multi-Angle Perspective & Knowledge Engine

> A fast, comprehensive multi-perspective knowledge search engine for leaders, countries, historical events, and concepts — powered by Wikipedia APIs. Built with **pure HTML, CSS, and Vanilla JavaScript** (no frameworks, no build tools).

---

##  Key Multi-Angle Features

When you search for any king, country, event, or leader (e.g. *India*, *Emperor Ashoka*, *China*, *Julius Caesar*, *Alexander the Great*), **Quick Puranas** automatically extracts and categorizes information into **6 distinct multi-perspective context cards**:

1.  **Encouragement & Spirit**: Inspirational essence, positive heritage, national/historical spirit, and celebrated triumphs.
2.  **Key Advantages & Major Strengths**: Strategic advantages, innovations, economic power, victories, and geopolitical strengths.
3.  **Disadvantages & Deficits**: Flaws, societal costs, vulnerabilities, structural hurdles, and historical drawbacks.
4.  **Triggers & Outrage Factors**: ("What makes someone angry") — Controversies, historical wars, massacres, harsh policies, and heated territorial disputes.
5.  **Bad Impression & Common Misconceptions**: Common myths, negative stereotypes vs historical reality, scandals, and public misperceptions.
6.  **Contributions & Lasting Legacy**: ("What has been done") — Concrete timeline of actions, legal reforms, monuments built, and lasting heritage.

### Additional Features:
-  **Multi-Media Image Gallery**: Fetches lead cover photos and gallery images dynamically attached to context angles.
-  **Perspective Filter Bar**: Quickly filter between all 6 perspectives or view single target angles (e.g., *Triggers & Outrage*, *Advantages*, *Legacy*).
-  **Debounced Live Autocomplete**: Real-time Wikipedia OpenSearch API suggestions debounced by 350ms.
-  **Search History**: LocalStorage persistence for recent topics.

---

##  Tech Stack

- **HTML5**: Semantic layout (`<header>`, `<main>`, `<article>`, `<nav>`, `<footer>`) with ARIA accessibility roles.
- **CSS3**: CSS Custom Properties (Variables), Modern Grid & Flexbox layouts, Glassmorphic top hero, custom typography (`Cinzel`, `Inter`, `Lora`), animated skeleton loaders, and responsive breakpoints.
- **Vanilla JavaScript (ES6+)**: `async/await`, Fetch API, custom debouncing, multi-bucket NLP sentence classification engine, and `localStorage`.
- **Wikipedia APIs**:
  - **Wikipedia OpenSearch API**: `https://en.wikipedia.org/w/api.php?action=opensearch`
  - **Wikipedia REST Summary API**: `https://en.wikipedia.org/api/rest_v1/page/summary/{title}`
  - **MediaWiki Action API Extracts & Images**: `https://en.wikipedia.org/w/api.php?action=query`

---

##  Getting Started

Simply open `index.html` in any browser or run a local HTTP server:

```bash
python -m http.server 8000
```
Then visit `http://localhost:8000`!
>>>>>>> de93c26 (Done upto the mark)
