/**
 * Quick Puranas — Digital History Theme Engine
 * Pure HTML, CSS & Vanilla JavaScript
 * Mimicking CHNM Digital History (chnm.gmu.edu/digitalhistory)
 */

// ==========================================================================
// 1. CONSTANTS & DOM ELEMENTS
// ==========================================================================
const STORAGE_KEY = 'quick_puranas_recent_searches';
const MAX_RECENT_SEARCHES = 6;
const DEBOUNCE_DELAY_MS = 350;

const elements = {
  searchInput: document.getElementById('search-input'),
  clearSearchBtn: document.getElementById('clear-search-btn'),
  loadingSpinner: document.getElementById('loading-spinner'),
  suggestionsBox: document.getElementById('suggestions-box'),
  
  recentSearchesSection: document.getElementById('recent-searches-section'),
  recentTagsContainer: document.getElementById('recent-tags'),
  clearHistoryBtn: document.getElementById('clear-history-btn'),
  
  statusMessage: document.getElementById('status-message'),
  resultsContainer: document.getElementById('results-container'),
  
  // Hero & Academic Elements
  heroImageWrapper: document.getElementById('hero-image-wrapper'),
  heroThumbnail: document.getElementById('hero-thumbnail'),
  topicTitle: document.getElementById('topic-title'),
  topicDescription: document.getElementById('topic-description'),
  readingTimeBadge: document.getElementById('reading-time-badge'),
  wikiFullLink: document.getElementById('wiki-full-link'),
  heroDropcap: document.getElementById('hero-dropcap'),
  
  // Sidebar Chapter Nav Tabs & Grid
  angleTabs: document.querySelectorAll('.dh-nav-item'),
  angleCards: document.querySelectorAll('.angle-card'),
  
  // Perspective Lists
  listEncouragement: document.getElementById('list-encouragement'),
  listAdvantages: document.getElementById('list-advantages'),
  listDisadvantages: document.getElementById('list-disadvantages'),
  listTriggers: document.getElementById('list-triggers'),
  listImpression: document.getElementById('list-impression'),
  listLegacy: document.getElementById('list-legacy'),
  
  // Perspective Media Containers
  mediaEncouragement: document.getElementById('media-encouragement'),
  mediaAdvantages: document.getElementById('media-advantages'),
  mediaDisadvantages: document.getElementById('media-disadvantages'),
  mediaTriggers: document.getElementById('media-triggers'),
  mediaImpression: document.getElementById('media-impression'),
  mediaLegacy: document.getElementById('media-legacy'),
  
  relatedTopicsGrid: document.getElementById('related-topics-grid')
};

let activeSuggestionIndex = -1;
let currentSuggestions = [];

// ==========================================================================
// 2. INITIALIZATION & EVENT LISTENERS
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initRecentSearches();
  setupEventListeners();
  setupSamplePills();
  setupAngleFilterTabs();
});

function setupEventListeners() {
  const debouncedSearch = debounce(handleSearchInput, DEBOUNCE_DELAY_MS);
  
  elements.searchInput.addEventListener('input', (e) => {
    toggleClearButton(e.target.value);
    debouncedSearch(e.target.value.trim());
  });

  elements.clearSearchBtn.addEventListener('click', () => {
    elements.searchInput.value = '';
    toggleClearButton('');
    hideSuggestions();
    elements.searchInput.focus();
  });

  elements.searchInput.addEventListener('keydown', handleKeyDown);

  document.addEventListener('click', (e) => {
    if (!elements.searchInput.contains(e.target) && !elements.suggestionsBox.contains(e.target)) {
      hideSuggestions();
    }
  });

  elements.clearHistoryBtn.addEventListener('click', clearRecentSearches);
}

function setupSamplePills() {
  document.querySelectorAll('.sample-pill').forEach(pill => {
    pill.addEventListener('click', (e) => {
      e.preventDefault();
      const query = pill.dataset.query;
      elements.searchInput.value = query;
      toggleClearButton(query);
      executeSearch(query);
    });
  });
}

function setupAngleFilterTabs() {
  elements.angleTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      elements.angleTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const targetAngle = tab.dataset.angle;
      filterPerspectiveCards(targetAngle);
    });
  });
}

function filterPerspectiveCards(targetAngle) {
  elements.angleCards.forEach(card => {
    if (targetAngle === 'all' || card.dataset.angle === targetAngle) {
      card.classList.remove('hidden');
    } else {
      card.classList.add('hidden');
    }
  });
}

// ==========================================================================
// 3. DEBOUNCE & UTILITY HELPERS
// ==========================================================================
function debounce(func, wait) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), wait);
  };
}

function toggleClearButton(value) {
  if (value.length > 0) {
    elements.clearSearchBtn.classList.remove('hidden');
  } else {
    elements.clearSearchBtn.classList.add('hidden');
  }
}

// ==========================================================================
// 4. LIVE OPENSEARCH AUTOCOMPLETE
// ==========================================================================
async function handleSearchInput(query) {
  if (!query) {
    hideSuggestions();
    return;
  }

  showSpinner(true);

  try {
    const url = `https://en.wikipedia.org/w/api.php?action=opensearch&format=json&origin=*&search=${encodeURIComponent(query)}&limit=6`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch suggestions');

    const data = await response.json();
    const suggestions = data[1] || [];
    renderSuggestions(suggestions, query);
  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    hideSuggestions();
  } finally {
    showSpinner(false);
  }
}

function renderSuggestions(suggestions, query) {
  currentSuggestions = suggestions;
  elements.suggestionsBox.innerHTML = '';
  activeSuggestionIndex = -1;

  if (suggestions.length === 0) {
    hideSuggestions();
    return;
  }

  suggestions.forEach((title, index) => {
    const li = document.createElement('li');
    li.className = 'suggestion-item';
    li.setAttribute('role', 'option');
    li.dataset.index = index;

    const matchRegex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
    const highlightedTitle = title.replace(matchRegex, '<strong>$1</strong>');

    li.innerHTML = `<span>${highlightedTitle}</span>`;

    li.addEventListener('click', () => {
      elements.searchInput.value = title;
      hideSuggestions();
      executeSearch(title);
    });

    elements.suggestionsBox.appendChild(li);
  });

  elements.suggestionsBox.classList.remove('hidden');
  elements.searchInput.setAttribute('aria-expanded', 'true');
}

function hideSuggestions() {
  elements.suggestionsBox.classList.add('hidden');
  elements.suggestionsBox.innerHTML = '';
  elements.searchInput.setAttribute('aria-expanded', 'false');
  activeSuggestionIndex = -1;
  currentSuggestions = [];
}

function handleKeyDown(e) {
  const items = elements.suggestionsBox.querySelectorAll('.suggestion-item');

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (items.length === 0) return;
    activeSuggestionIndex = (activeSuggestionIndex + 1) % items.length;
    updateActiveSuggestion(items);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (items.length === 0) return;
    activeSuggestionIndex = (activeSuggestionIndex - 1 + items.length) % items.length;
    updateActiveSuggestion(items);
  } else if (e.key === 'Enter') {
    if (activeSuggestionIndex >= 0 && items[activeSuggestionIndex]) {
      e.preventDefault();
      const selectedTitle = currentSuggestions[activeSuggestionIndex];
      elements.searchInput.value = selectedTitle;
      hideSuggestions();
      executeSearch(selectedTitle);
    } else if (elements.searchInput.value.trim()) {
      e.preventDefault();
      hideSuggestions();
      executeSearch(elements.searchInput.value.trim());
    }
  } else if (e.key === 'Escape') {
    hideSuggestions();
  }
}

function updateActiveSuggestion(items) {
  items.forEach((item, index) => {
    if (index === activeSuggestionIndex) {
      item.classList.add('active');
      item.scrollIntoView({ block: 'nearest' });
      elements.searchInput.value = currentSuggestions[index];
    } else {
      item.classList.remove('active');
    }
  });
}

// ==========================================================================
// 5. MAIN MULTI-ANGLE CONTEXT SEARCH ENGINE
// ==========================================================================
async function executeSearch(topicTitle) {
  if (!topicTitle) return;

  const query = topicTitle.trim();
  showLoadingSkeleton();
  addRecentSearch(query);

  try {
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
    const summaryRes = await fetch(summaryUrl);

    if (summaryRes.status === 404) {
      showErrorState(`No historical entry found for "${query}". Please check spelling or try another topic.`);
      return;
    }

    if (!summaryRes.ok) throw new Error(`Wikipedia REST API error ${summaryRes.status}`);

    const summaryData = await summaryRes.json();

    if (summaryData.type === 'disambiguation') {
      renderDisambiguationState(summaryData);
      return;
    }

    const detailUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(query)}&prop=extracts|pageimages&explaintext=1&pithumbsize=600&origin=*&format=json`;
    const detailRes = await fetch(detailUrl);
    const detailData = await detailRes.json();

    let fullExtract = summaryData.extract || '';
    if (detailData.query && detailData.query.pages) {
      const pageObj = Object.values(detailData.query.pages)[0];
      if (pageObj && pageObj.extract) {
        fullExtract = pageObj.extract;
      }
    }

    const imagesList = await fetchArticleImages(query);
    const relatedPages = await fetchRelatedTopics(query);
    const perspectives = categorizeMultiAnglePerspectives(fullExtract, summaryData, query);

    renderResults(summaryData, perspectives, imagesList, relatedPages, query);

  } catch (error) {
    console.error('Error fetching multi-angle context:', error);
    showErrorState('Unable to load historical context. Please check network connection and try again.');
  }
}

async function fetchArticleImages(topicTitle) {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(topicTitle)}&generator=images&gimlimit=8&prop=imageinfo&iiprop=url&origin=*&format=json`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.query || !data.query.pages) return [];

    const validExts = ['.jpg', '.jpeg', '.png', '.webp', '.svg'];
    return Object.values(data.query.pages)
      .map(p => p.imageinfo?.[0]?.url)
      .filter(url => url && validExts.some(ext => url.toLowerCase().endsWith(ext)))
      .filter(url => !url.includes('commons-logo') && !url.includes('Symbol_') && !url.includes('Edit-clear'));
  } catch (e) {
    console.warn('Failed to fetch article images:', e);
    return [];
  }
}

async function fetchRelatedTopics(topicTitle) {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(topicTitle)}&gsrlimit=6&prop=extracts|info&exintro=1&explaintext=1&exchars=140&inprop=url&origin=*&format=json`;
    const response = await fetch(searchUrl);
    if (!response.ok) return [];

    const data = await response.json();
    if (!data.query || !data.query.pages) return [];

    return Object.values(data.query.pages)
      .filter(page => page.title.toLowerCase() !== topicTitle.toLowerCase())
      .slice(0, 4);
  } catch (err) {
    console.warn('Failed to fetch related topics:', err);
    return [];
  }
}

// ==========================================================================
// 6. MULTI-PERSPECTIVE TEXT & SENTENCE CLASSIFICATION ENGINE
// ==========================================================================

function categorizeMultiAnglePerspectives(fullText, summaryData, query) {
  const result = {
    encouragement: [],
    advantages: [],
    disadvantages: [],
    triggers: [],
    impression: [],
    legacy: []
  };

  const cleanedText = (fullText || '')
    .replace(/\[\d+\]/g, '')
    .replace(/\[citation needed\]/gi, '');

  const sentences = cleanedText
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 25 && !s.startsWith('=='));

  const patterns = {
    triggers: /\b(war|conflict|dispute|massacre|invasion|conquest|angry|outrage|sanctions|rebellion|tension|violence|executed|assassination|death|slaughter|oppression|riot|crisis|controversy|hostility)\b/i,
    advantages: /\b(advantage|strength|power|victory|achievement|invention|growth|thriving|wealth|prosperity|flourished|dominant|trade|leading|pioneer|breakthrough|reform|alliance|expansion)\b/i,
    disadvantages: /\b(decline|loss|deficit|poverty|limitation|hardship|vulnerability|downfall|collapse|famine|crisis|debt|flaw|weakness|failure|suffered|handicap|shortage|loss)\b/i,
    impression: /\b(misconception|stereotype|bad impression|scandal|bias|criticized|notoriety|perceived|alleged|infamous|harsh|ruthless|reputation|viewed as|criticism|disrepute)\b/i,
    legacy: /\b(legacy|contribution|built|established|founded|heritage|statue|monument|law|constitution|dynasty|heritage|influenced|impact|father of|mother of|introduced|origin|reformed)\b/i,
    encouragement: /\b(inspiring|spirit|glory|golden age|celebrated|heroic|renowned|iconic|unity|symbol|pride|triumph|noble|cultural|rich|resilient|freedom|peace|harmony)\b/i
  };

  sentences.forEach(s => {
    if (patterns.triggers.test(s) && result.triggers.length < 4) {
      result.triggers.push(s);
    } else if (patterns.advantages.test(s) && result.advantages.length < 4) {
      result.advantages.push(s);
    } else if (patterns.disadvantages.test(s) && result.disadvantages.length < 4) {
      result.disadvantages.push(s);
    } else if (patterns.impression.test(s) && result.impression.length < 4) {
      result.impression.push(s);
    } else if (patterns.legacy.test(s) && result.legacy.length < 4) {
      result.legacy.push(s);
    } else if (patterns.encouragement.test(s) && result.encouragement.length < 4) {
      result.encouragement.push(s);
    }
  });

  const leadParagraphs = (summaryData.extract || fullText || '').split(/(?<=[.!?])\s+/).filter(s => s.length > 25);
  
  if (result.encouragement.length < 2) {
    result.encouragement.push(
      leadParagraphs[0] || `${query} is widely studied for its distinct place in history and cultural development.`,
      leadParagraphs[1] || `It embodies a rich heritage that continues to inspire research and public interest worldwide.`
    );
  }

  if (result.advantages.length < 2) {
    result.advantages.push(
      leadParagraphs[1] || `Key strengths include significant strategic, economic, or cultural accomplishments.`,
      leadParagraphs[2] || `Demonstrated major influence and innovations within its domain and region.`
    );
  }

  if (result.disadvantages.length < 2) {
    result.disadvantages.push(
      `Faced notable structural challenges, political hurdles, or resource deficits during key eras.`,
      `Historical records highlight vulnerabilities and systemic costs experienced over time.`
    );
  }

  if (result.triggers.length < 2) {
    result.triggers.push(
      `Sparks intense debate regarding territorial disputes, policy actions, or military conflicts.`,
      `Events surrounding key leadership decisions or conflicts frequently provoke strong public reactions.`
    );
  }

  if (result.impression.length < 2) {
    result.impression.push(
      `Often subject to popular misconceptions, oversimplified stereotypes, or partial historical biases.`,
      `Critical evaluations highlight moments where public perception differed sharply from underlying facts.`
    );
  }

  if (result.legacy.length < 2) {
    result.legacy.push(
      leadParagraphs[0] || `Left a lasting footprint through legal frameworks, architectural works, or institutional developments.`,
      leadParagraphs[leadParagraphs.length - 1] || `Its historical contributions continue to shape modern understanding and institutions.`
    );
  }

  return result;
}

// ==========================================================================
// 7. RENDERERS & DOM UPDATES
// ==========================================================================

function renderResults(summaryData, perspectives, imagesList, relatedPages, query) {
  hideStatusMessage();

  // 1. Academic Header & Dropcap
  elements.topicTitle.textContent = summaryData.title;
  elements.topicDescription.textContent = summaryData.description || 'Historical Multi-Angle Profile';
  elements.wikiFullLink.href = summaryData.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(summaryData.title)}`;
  
  if (elements.heroDropcap) {
    elements.heroDropcap.textContent = (summaryData.title || 'T').charAt(0).toUpperCase();
  }

  const extractText = summaryData.extract || '';
  elements.readingTimeBadge.textContent = `${calculateReadingTime(extractText)} read`;

  // Hero Lead Image
  if (summaryData.thumbnail && summaryData.thumbnail.source) {
    elements.heroThumbnail.src = summaryData.thumbnail.source;
    elements.heroThumbnail.alt = summaryData.title;
    elements.heroImageWrapper.classList.remove('hidden');
  } else if (imagesList.length > 0) {
    elements.heroThumbnail.src = imagesList[0];
    elements.heroThumbnail.alt = summaryData.title;
    elements.heroImageWrapper.classList.remove('hidden');
  } else {
    elements.heroImageWrapper.classList.add('hidden');
  }

  // 2. Render 6 Perspective Bullet Lists
  renderPerspectiveList(elements.listEncouragement, perspectives.encouragement, query);
  renderPerspectiveList(elements.listAdvantages, perspectives.advantages, query);
  renderPerspectiveList(elements.listDisadvantages, perspectives.disadvantages, query);
  renderPerspectiveList(elements.listTriggers, perspectives.triggers, query);
  renderPerspectiveList(elements.listImpression, perspectives.impression, query);
  renderPerspectiveList(elements.listLegacy, perspectives.legacy, query);

  // 3. Attach Images to Context Cards
  attachImagesToCards(imagesList);

  // 4. Render Related Topics Grid
  renderRelatedTopicsCard(relatedPages);

  // Show results dashboard
  elements.resultsContainer.classList.remove('hidden');

  // Reset tab filter to All
  filterPerspectiveCards('all');
  elements.angleTabs.forEach(t => t.classList.remove('active'));
  document.querySelector('.dh-nav-item[data-angle="all"]')?.classList.add('active');
}

function renderPerspectiveList(container, items, query) {
  container.innerHTML = '';
  if (!items || items.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No specific context data extracted.';
    container.appendChild(li);
    return;
  }

  items.slice(0, 4).forEach(item => {
    const li = document.createElement('li');
    li.innerHTML = highlightTerms(item, query);
    container.appendChild(li);
  });
}

function attachImagesToCards(imagesList) {
  const mediaContainers = [
    elements.mediaEncouragement,
    elements.mediaAdvantages,
    elements.mediaDisadvantages,
    elements.mediaTriggers,
    elements.mediaImpression,
    elements.mediaLegacy
  ];

  mediaContainers.forEach(container => {
    container.innerHTML = '';
    container.classList.add('hidden');
  });

  if (!imagesList || imagesList.length === 0) return;

  mediaContainers.forEach((container, idx) => {
    const imgUrl = imagesList[idx % imagesList.length];
    if (imgUrl) {
      const img = document.createElement('img');
      img.className = 'media-thumbnail';
      img.src = imgUrl;
      img.alt = 'Context visual';
      img.loading = 'lazy';
      img.addEventListener('click', () => window.open(imgUrl, '_blank'));
      container.appendChild(img);
      container.classList.remove('hidden');
    }
  });
}

function renderRelatedTopicsCard(relatedPages) {
  elements.relatedTopicsGrid.innerHTML = '';

  if (!relatedPages || relatedPages.length === 0) {
    elements.relatedTopicsGrid.innerHTML = '<p class="topic-subtext">No related topics found.</p>';
    return;
  }

  relatedPages.forEach(page => {
    const card = document.createElement('div');
    card.className = 'related-card';

    const snippet = page.extract ? page.extract.replace(/\n/g, ' ') : 'Click to explore multi-angle context.';

    card.innerHTML = `
      <h4>${escapeHTML(page.title)}</h4>
      <p>${escapeHTML(snippet)}</p>
    `;

    card.addEventListener('click', () => {
      elements.searchInput.value = page.title;
      executeSearch(page.title);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    elements.relatedTopicsGrid.appendChild(card);
  });
}

// ==========================================================================
// 8. TEXT PROCESSING & UTILITY HELPERS
// ==========================================================================

function calculateReadingTime(text) {
  if (!text) return '~1 min';
  const wordCount = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(wordCount / 180);
  return minutes <= 1 ? '~1 min' : `~${minutes} min`;
}

function highlightTerms(text, query) {
  if (!text || !query) return escapeHTML(text);

  const safeText = escapeHTML(text);
  const words = query.split(/\s+/).filter(w => w.length > 2);
  
  if (words.length === 0) return safeText;

  const pattern = new RegExp(`\\b(${words.map(escapeRegExp).join('|')})\\b`, 'gi');
  return safeText.replace(pattern, '<mark class="highlight-term">$1</mark>');
}

function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ==========================================================================
// 9. STATE MANAGERS (Loading / Error / Disambiguation)
// ==========================================================================

function showLoadingSkeleton() {
  elements.resultsContainer.classList.add('hidden');
  elements.statusMessage.classList.remove('hidden');

  elements.statusMessage.innerHTML = `
    <div style="padding: 2rem; background: #fff; border: 1px solid #b8b193; text-align: center; font-style: italic;">
      Searching historical archives for multi-angle context...
    </div>
  `;
}

function showErrorState(message) {
  elements.resultsContainer.classList.add('hidden');
  elements.statusMessage.classList.remove('hidden');

  elements.statusMessage.innerHTML = `
    <div style="padding: 1.5rem; background: #fff1f2; border: 1px solid #fecdd3; color: #990000; font-family: Georgia, serif;">
      <strong>Historical Archive Note:</strong> ${escapeHTML(message)}
    </div>
  `;
}

function renderDisambiguationState(summaryData) {
  elements.resultsContainer.classList.add('hidden');
  elements.statusMessage.classList.remove('hidden');

  const wikiUrl = summaryData.content_urls?.desktop?.page || '#';

  elements.statusMessage.innerHTML = `
    <div style="padding: 1.5rem; background: #fffbe6; border: 1px solid #b8b193; color: #381414;">
      <h3 style="font-family: Cinzel, serif; font-size: 1.1rem; margin-bottom: 0.5rem;">"${escapeHTML(summaryData.title)}" has multiple meanings</h3>
      <p>${escapeHTML(summaryData.extract || 'This topic refers to multiple articles on Wikipedia.')}</p>
      <div style="margin-top: 1rem;">
        <a href="${wikiUrl}" target="_blank" rel="noopener noreferrer" class="dh-wiki-button">
          View Disambiguation Options on Wikipedia &nearr;
        </a>
      </div>
    </div>
  `;
}

function hideStatusMessage() {
  elements.statusMessage.classList.add('hidden');
  elements.statusMessage.innerHTML = '';
}

function showSpinner(show) {
  if (show) {
    elements.loadingSpinner.classList.remove('hidden');
    elements.clearSearchBtn.classList.add('hidden');
  } else {
    elements.loadingSpinner.classList.add('hidden');
    if (elements.searchInput.value.length > 0) {
      elements.clearSearchBtn.classList.remove('hidden');
    }
  }
}

// ==========================================================================
// 10. LOCAL STORAGE & RECENT SEARCHES
// ==========================================================================

function initRecentSearches() {
  const history = getRecentSearches();
  renderRecentSearches(history);
}

function getRecentSearches() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : ['India', 'Emperor Ashoka', 'Julius Caesar', 'China'];
  } catch (e) {
    console.warn('LocalStorage error:', e);
    return ['India', 'Emperor Ashoka', 'Julius Caesar', 'China'];
  }
}

function addRecentSearch(topic) {
  if (!topic) return;

  let history = getRecentSearches();
  history = history.filter(item => item.toLowerCase() !== topic.toLowerCase());
  history.unshift(topic);
  history = history.slice(0, MAX_RECENT_SEARCHES);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    renderRecentSearches(history);
  } catch (e) {
    console.warn('Failed to save recent search:', e);
  }
}

function clearRecentSearches() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    renderRecentSearches([]);
  } catch (e) {
    console.warn('Failed to clear recent searches:', e);
  }
}

function renderRecentSearches(history) {
  elements.recentTagsContainer.innerHTML = '';

  if (!history || history.length === 0) {
    elements.recentSearchesSection.classList.add('hidden');
    return;
  }

  elements.recentSearchesSection.classList.remove('hidden');

  history.forEach(topic => {
    const pill = document.createElement('button');
    pill.className = 'tag-pill';
    pill.setAttribute('type', 'button');
    pill.innerHTML = `${escapeHTML(topic)}`;

    pill.addEventListener('click', () => {
      elements.searchInput.value = topic;
      toggleClearButton(topic);
      executeSearch(topic);
    });

    elements.recentTagsContainer.appendChild(pill);
  });
}
