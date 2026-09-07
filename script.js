/**
 * Quick Puranas - Multi-Angle Contextual Learning Search Tool
 * Pure HTML, CSS & Vanilla JavaScript
 * 
 * Features:
 * - Debounced live search with Wikipedia OpenSearch API
 * - Multi-context cards (Short Summary, Key Facts, Related Topics, Wikipedia Link)
 * - Sentence-based Key Facts extractor
 * - Reading time estimation (~1 min read)
 * - Recent search history saved in localStorage
 * - Robust handling for CORS, 404s, and Disambiguation pages
 */

// ==========================================================================
// 1. DOM ELEMENTS & CONSTANTS
// ==========================================================================
const STORAGE_KEY = 'quick_puranas_recent_searches';
const MAX_RECENT_SEARCHES = 5;
const DEBOUNCE_DELAY_MS = 350;

// Cache DOM elements for fast access
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
  
  // Results Elements
  topicTitle: document.getElementById('topic-title'),
  topicDescription: document.getElementById('topic-description'),
  readingTimeBadge: document.getElementById('reading-time-badge'),
  topicTypeBadge: document.getElementById('topic-type-badge'),
  wikiFullLink: document.getElementById('wiki-full-link'),
  
  summaryThumbnailWrapper: document.getElementById('summary-thumbnail-wrapper'),
  summaryThumbnail: document.getElementById('summary-thumbnail'),
  summaryText: document.getElementById('summary-text'),
  
  keyFactsList: document.getElementById('key-facts-list'),
  relatedTopicsGrid: document.getElementById('related-topics-grid')
};

// Application State
let activeSuggestionIndex = -1;
let currentSuggestions = [];

// ==========================================================================
// 2. INITIALIZATION & EVENT LISTENERS
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initRecentSearches();
  setupEventListeners();
});

function setupEventListeners() {
  // Debounced input handler for live search suggestions
  const debouncedSearch = debounce(handleSearchInput, DEBOUNCE_DELAY_MS);
  elements.searchInput.addEventListener('input', (e) => {
    toggleClearButton(e.target.value);
    debouncedSearch(e.target.value.trim());
  });

  // Clear search input button
  elements.clearSearchBtn.addEventListener('click', () => {
    elements.searchInput.value = '';
    toggleClearButton('');
    hideSuggestions();
    elements.searchInput.focus();
  });

  // Keyboard navigation for search suggestions
  elements.searchInput.addEventListener('keydown', handleKeyDown);

  // Close suggestions when clicking outside
  document.addEventListener('click', (e) => {
    if (!elements.searchInput.contains(e.target) && !elements.suggestionsBox.contains(e.target)) {
      hideSuggestions();
    }
  });

  // Clear recent search history
  elements.clearHistoryBtn.addEventListener('click', clearRecentSearches);
}

// ==========================================================================
// 3. UTILITY FUNCTIONS
// ==========================================================================

/**
 * Standard Debounce Utility Function
 * Delays function execution until after wait milliseconds have passed since last call.
 */
function debounce(func, wait) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * Toggles visibility of the 'X' clear search button based on input length
 */
function toggleClearButton(value) {
  if (value.length > 0) {
    elements.clearSearchBtn.classList.remove('hidden');
  } else {
    elements.clearSearchBtn.classList.add('hidden');
  }
}

// ==========================================================================
// 4. LIVE SEARCH SUGGESTIONS (Wikipedia OpenSearch API)
// ==========================================================================

async function handleSearchInput(query) {
  if (!query) {
    hideSuggestions();
    return;
  }

  showSpinner(true);

  try {
    // Wikipedia OpenSearch API Endpoint (Requires origin=* for CORS)
    const url = `https://en.wikipedia.org/w/api.php?action=opensearch&format=json&origin=*&search=${encodeURIComponent(query)}&limit=6`;
    const response = await fetch(url);

    if (!response.ok) throw new Error('Failed to fetch suggestions');

    const data = await response.json();
    // OpenSearch format: [query, [titles], [descriptions], [urls]]
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

    // Highlight query text in suggestion
    const matchRegex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
    const highlightedTitle = title.replace(matchRegex, '<strong>$1</strong>');

    li.innerHTML = `
      <span class="item-icon" aria-hidden="true">🔍</span>
      <span>${highlightedTitle}</span>
    `;

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

/**
 * Handle Keyboard Navigation inside the suggestions list
 */
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
// 5. MAIN TOPIC SEARCH & DATA FETCHING
// ==========================================================================

async function executeSearch(topicTitle) {
  if (!topicTitle) return;

  // Normalize search term
  const query = topicTitle.trim();
  showLoadingSkeleton();
  addRecentSearch(query);

  try {
    // 1. Fetch REST API Page Summary
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
    const summaryResponse = await fetch(summaryUrl);

    if (summaryResponse.status === 404) {
      showErrorState(`No Wikipedia article found for "${query}". Please check your spelling or try another topic.`);
      return;
    }

    if (!summaryResponse.ok) {
      throw new Error(`Wikipedia REST API Error: ${summaryResponse.status}`);
    }

    const summaryData = await summaryResponse.json();

    // Handle Disambiguation Pages (topics with multiple meanings)
    if (summaryData.type === 'disambiguation') {
      renderDisambiguationState(summaryData);
      return;
    }

    // 2. Fetch Related Topics using MediaWiki Action API Search Generator
    // (We use this action search generator since rest_v1/page/related is decommissioned)
    const relatedPages = await fetchRelatedTopics(query);

    // 3. Render all context sections
    renderResults(summaryData, relatedPages, query);
  } catch (error) {
    console.error('Error fetching topic context:', error);
    showErrorState('Unable to load topic details. Please check your internet connection and try again.');
  }
}

/**
 * Fetches related articles using MediaWiki Action API Search Generator
 */
async function fetchRelatedTopics(topicTitle) {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(topicTitle)}&gsrlimit=6&prop=extracts|info&exintro=1&explaintext=1&exchars=140&inprop=url&origin=*&format=json`;
    const response = await fetch(searchUrl);

    if (!response.ok) return [];

    const data = await response.json();
    if (!data.query || !data.query.pages) return [];

    // Transform pages dictionary to array & exclude current article
    return Object.values(data.query.pages)
      .filter(page => page.title.toLowerCase() !== topicTitle.toLowerCase())
      .slice(0, 4);
  } catch (err) {
    console.warn('Failed to fetch related topics:', err);
    return [];
  }
}

// ==========================================================================
// 6. RENDERERS & DATA TRANSFORMERS
// ==========================================================================

function renderResults(summaryData, relatedPages, query) {
  hideStatusMessage();

  // 1. Topic Header
  elements.topicTitle.textContent = summaryData.title;
  elements.topicDescription.textContent = summaryData.description || 'Topic Overview';
  elements.wikiFullLink.href = summaryData.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(summaryData.title)}`;
  
  // Reading Time Estimate
  const extractText = summaryData.extract || 'No detailed summary available.';
  const readingTime = calculateReadingTime(extractText);
  elements.readingTimeBadge.textContent = `${readingTime} read`;
  elements.topicTypeBadge.textContent = summaryData.type === 'standard' ? 'Overview' : 'Article';

  // 2. Context Card 1: Short Summary with Term Highlighting & Image
  renderSummaryCard(summaryData, extractText, query);

  // 3. Context Card 2: Key Facts Extractor
  renderKeyFactsCard(extractText, query);

  // 4. Context Card 3: Related Topics Grid
  renderRelatedTopicsCard(relatedPages);

  // Display results dashboard
  elements.resultsContainer.classList.remove('hidden');
}

function renderSummaryCard(summaryData, text, query) {
  // Handle Thumbnail Image
  if (summaryData.thumbnail && summaryData.thumbnail.source) {
    elements.summaryThumbnail.src = summaryData.thumbnail.source;
    elements.summaryThumbnail.alt = summaryData.title;
    elements.summaryThumbnailWrapper.classList.remove('hidden');
  } else {
    elements.summaryThumbnailWrapper.classList.add('hidden');
  }

  // Highlight key terms in the summary text
  elements.summaryText.innerHTML = highlightTerms(text, query);
}

function renderKeyFactsCard(text, query) {
  elements.keyFactsList.innerHTML = '';

  const keyFacts = extractKeyFacts(text);

  if (keyFacts.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No distinct bullet points extracted from summary.';
    elements.keyFactsList.appendChild(li);
    return;
  }

  keyFacts.forEach(fact => {
    const li = document.createElement('li');
    li.innerHTML = highlightTerms(fact, query);
    elements.keyFactsList.appendChild(li);
  });
}

function renderRelatedTopicsCard(relatedPages) {
  elements.relatedTopicsGrid.innerHTML = '';

  if (!relatedPages || relatedPages.length === 0) {
    elements.relatedTopicsGrid.innerHTML = '<p class="topic-subtext">No related topics found for this query.</p>';
    return;
  }

  relatedPages.forEach(page => {
    const card = document.createElement('div');
    card.className = 'related-card';

    const snippet = page.extract ? page.extract.replace(/\n/g, ' ') : 'Click to explore this topic.';

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
// 7. SMART TEXT PROCESSING HELPERS
// ==========================================================================

/**
 * Key Facts Extractor: Splits paragraph into clean sentences,
 * removes inline citations, and selects top 3-5 informative sentences.
 */
function extractKeyFacts(text) {
  if (!text) return [];

  // Remove Wikipedia inline citations like [1], [citation needed]
  const cleanedText = text.replace(/\[\d+\]/g, '').replace(/\[citation needed\]/gi, '');

  // Split into sentences using regular expression looking for sentence terminators (. ! ?)
  const sentences = cleanedText
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 20); // Exclude very short fragments

  // Return top 3-5 clean sentences
  return sentences.slice(0, 5);
}

/**
 * Estimates reading time in minutes assuming average speed of 200 WPM
 */
function calculateReadingTime(text) {
  if (!text) return '~1 min';
  const wordCount = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(wordCount / 180);
  return minutes <= 1 ? '~1 min' : `~${minutes} min`;
}

/**
 * Bolds/Highlights search query terms inside summary text
 */
function highlightTerms(text, query) {
  if (!text || !query) return escapeHTML(text);

  const safeText = escapeHTML(text);
  const words = query.split(/\s+/).filter(w => w.length > 2);
  
  if (words.length === 0) return safeText;

  // Build regex matching query words (case-insensitive)
  const pattern = new RegExp(`\\b(${words.map(escapeRegExp).join('|')})\\b`, 'gi');
  return safeText.replace(pattern, '<mark class="term-highlight">$1</mark>');
}

// ==========================================================================
// 8. STATE MANAGERS (Loading / Error / Disambiguation)
// ==========================================================================

function showLoadingSkeleton() {
  elements.resultsContainer.classList.add('hidden');
  elements.statusMessage.classList.remove('hidden');

  elements.statusMessage.innerHTML = `
    <div class="skeleton-card">
      <div class="skeleton-line title"></div>
      <div class="skeleton-line full"></div>
      <div class="skeleton-line medium"></div>
      <div class="skeleton-line full"></div>
    </div>
  `;
}

function showErrorState(message) {
  elements.resultsContainer.classList.add('hidden');
  elements.statusMessage.classList.remove('hidden');

  elements.statusMessage.innerHTML = `
    <div class="error-card">
      <span class="error-icon" aria-hidden="true">⚠️</span>
      <div>
        <strong>Search Note</strong>
        <p style="margin-top: 0.25rem;">${escapeHTML(message)}</p>
      </div>
    </div>
  `;
}

function renderDisambiguationState(summaryData) {
  elements.resultsContainer.classList.add('hidden');
  elements.statusMessage.classList.remove('hidden');

  const wikiUrl = summaryData.content_urls?.desktop?.page || '#';

  elements.statusMessage.innerHTML = `
    <div class="disambiguation-card">
      <h3><span>💡</span> "${escapeHTML(summaryData.title)}" has multiple meanings</h3>
      <p>${escapeHTML(summaryData.extract || 'This topic refers to multiple articles on Wikipedia.')}</p>
      <div style="margin-top: 1rem;">
        <a href="${wikiUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="font-size: 0.85rem; padding: 0.5rem 1rem;">
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
// 9. LOCAL STORAGE & RECENT SEARCHES
// ==========================================================================

function initRecentSearches() {
  const history = getRecentSearches();
  renderRecentSearches(history);
}

function getRecentSearches() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : ['Quantum Computing', 'Renaissance', 'Indus Valley Civilization'];
  } catch (e) {
    console.warn('LocalStorage error:', e);
    return ['Quantum Computing', 'Renaissance', 'Indus Valley Civilization'];
  }
}

function addRecentSearch(topic) {
  if (!topic) return;

  let history = getRecentSearches();
  // Filter out duplicate topic if it already exists (case-insensitive)
  history = history.filter(item => item.toLowerCase() !== topic.toLowerCase());
  // Prepend new topic
  history.unshift(topic);
  // Keep only max items
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
    pill.innerHTML = `<span>🕒</span> ${escapeHTML(topic)}`;

    pill.addEventListener('click', () => {
      elements.searchInput.value = topic;
      toggleClearButton(topic);
      executeSearch(topic);
    });

    elements.recentTagsContainer.appendChild(pill);
  });
}

// ==========================================================================
// 10. SECURITY & STRING HELPERS
// ==========================================================================

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
