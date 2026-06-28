// === 1. GLOBALS ===
let KJV = {};
let currentBook = 'Genesis';
let currentChapter = 1;
let verseIndex = [];
let highlights = JSON.parse(localStorage.getItem('kjv-highlights') || '{}');
let notes = JSON.parse(localStorage.getItem('kjv-notes') || '{}');

// Gospel books for red letter detection
const GOSPELS = ['Matthew', 'Mark', 'Luke', 'John'];

// === 2. INIT ===
document.addEventListener('DOMContentLoaded', async () => {
  await loadBible();
  buildSearchIndex();
  setupEventListeners();
  renderBookSelector();
  loadChapter(currentBook, currentChapter);
  registerServiceWorker();
});

async function loadBible() {
  // bible.js should be: const KJV = {...};
  const script = document.createElement('script');
  script.src = './bible.js';
  document.head.appendChild(script);
  await new Promise(resolve => script.onload = resolve);
  KJV = window.KJV;
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js');
  }
}

// === 3. SEARCH INDEX ===
function buildSearchIndex() {
  verseIndex = [];
  for (const book in KJV) {
    for (const ch in KJV) {
      for (const v in KJV[ch]) {
        verseIndex.push({
          ref: `${book} ${ch}:${v}`,
          book, ch: +ch, v: +v,
          text: KJV[ch][v].toLowerCase(),
          id: `${book}-${ch}-${v}`
        });
      }
    }
  }
}

function searchVerses(query, limit = 50) {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  const words = q.split(' ').filter(w => w.length > 1);

  return verseIndex
  .filter(v => words.every(w => v.text.includes(w)))
  .slice(0, limit)
  .map(v => ({
      ref: v.ref,
      text: KJV[v.book][v.ch][v.v],
      id: v.id,
      book: v.book, ch: v.ch, v: v.v
    }));
}

// === 4. RENDERING ===
function renderBookSelector() {
  const books = Object.keys(KJV);
  const select = document.getElementById('book-select');
  select.innerHTML = books.map(b => `<option value="${b}" ${b===currentBook?'selected':''}>${b}</option>`).join('');
}

function renderChapterSelector() {
  const chapters = Object.keys(KJV[currentBook]);
  const select = document.getElementById('chapter-select');
  select.innerHTML = chapters.map(c => `<option value="${c}" ${c==currentChapter?'selected':''}>${c}</option>`).join('');
}

function loadChapter(book, chapter) {
  currentBook = book;
  currentChapter = +chapter;
  localStorage.setItem('kjv-last-read', JSON.stringify({book, chapter}));
  renderChapterSelector();
  renderChapter();
  window.scrollTo(0,0);
}

function renderChapter() {
  const container = document.getElementById('verses');
  const verses = KJV[currentBook][currentChapter];
  const isGospel = GOSPELS.includes(currentBook);

  container.innerHTML = Object.entries(verses).map(([v, text]) => {
    const id = `${currentBook}-${currentChapter}-${v}`;
    const isHighlighted = highlights[id];
    const hasNote = notes[id];

    // Red letter: wrap quoted speech in Gospels
    let displayText = text;
    if (isGospel) {
      displayText = text.replace(/“([^”]+)”/g, '<span class="red">“$1”</span>');
    }

    return `
      <div class="verse ${isHighlighted? 'highlighted' : ''}" data-id="${id}" data-book="${currentBook}" data-ch="${currentChapter}" data-v="${v}">
        <sup>${v}</sup>
        <span class="text">${displayText}</span>
        ${hasNote? `<span class="note-icon" title="${escapeHtml(hasNote)}">📝</span>` : ''}
      </div>
    `;
  }).join('');

  document.getElementById('current-ref').textContent = `${currentBook} ${currentChapter}`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// === 5. HIGHLIGHTS + NOTES ===
function toggleHighlight(id) {
  if (highlights[id]) delete highlights[id];
  else highlights[id] = Date.now();
  localStorage.setItem('kjv-highlights', JSON.stringify(highlights));
  renderChapter();
}

function saveNote(id, noteText) {
  if (noteText.trim()) notes[id] = noteText.trim();
  else delete notes[id];
  localStorage.setItem('kjv-notes', JSON.stringify(notes));
  renderChapter();
}

function showVerseMenu(id) {
  const [book, ch, v] = id.split('-');
  const hasNote = notes[id];
  const isHighlighted = highlights[id];

  const action = prompt(
    `Verse: ${book} ${ch}:${v}\n\n1 = Toggle Highlight\n2 = Add/Edit Note\n3 = Delete Note\n\nCurrent note: ${hasNote || 'None'}`,
    hasNote || ''
  );

  if (action === '1') toggleHighlight(id);
  else if (action === '2') {
    const note = prompt('Enter note:', hasNote || '');
    if (note!== null) saveNote(id, note);
  }
  else if (action === '3') saveNote(id, '');
}

// === 6. COPY WITH REFERENCE ===
document.addEventListener('copy', e => {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;

  const range = selection.getRangeAt(0);
  let verseEl = range.commonAncestorContainer;
  if (verseEl.nodeType === 3) verseEl = verseEl.parentElement;
  verseEl = verseEl.closest('.verse');
  if (!verseEl) return;

  const {book, ch, v} = verseEl.dataset;
  const text = selection.toString().trim().replace(/\s+/g, ' ');

  if (text) {
    e.clipboardData.setData('text/plain', `${text} — ${book} ${ch}:${v} KJV`);
    e.preventDefault();
  }
});

// === 7. EVENT LISTENERS ===
function setupEventListeners() {
  // Book/chapter nav
  document.getElementById('book-select').onchange = e => loadChapter(e.target.value, 1);
  document.getElementById('chapter-select').onchange = e => loadChapter(currentBook, e.target.value);
  document.getElementById('prev-ch').onclick = () => navChapter(-1);
  document.getElementById('next-ch').onclick = () => navChapter(1);

  // Search
  const searchInput = document.getElementById('search');
  const resultsDiv = document.getElementById('search-results');
  searchInput.oninput = e => {
    const results = searchVerses(e.target.value);
    if (!e.target.value) {
      resultsDiv.innerHTML = '';
      resultsDiv.style.display = 'none';
      return;
    }
    resultsDiv.style.display = 'block';
    resultsDiv.innerHTML = results.map(r =>
      `<div class="search-result" data-book="${r.book}" data-ch="${r.ch}">
        <b>${r.ref}</b> ${r.text}
      </div>`
    ).join('');
  };

  // Click search result
  resultsDiv.onclick = e => {
    const res = e.target.closest('.search-result');
    if (res) {
      loadChapter(res.dataset.book, res.dataset.ch);
      searchInput.value = '';
      resultsDiv.style.display = 'none';
    }
  };

  // Verse click = menu
  document.getElementById('verses').onclick = e => {
    const verse = e.target.closest('.verse');
    if (verse) showVerseMenu(verse.dataset.id);
  };

  // Restore last read
  const last = JSON.parse(localStorage.getItem('kjv-last-read') || 'null');
  if (last) {
    currentBook = last.book;
    currentChapter = last.chapter;
  }
}

function navChapter(dir) {
  const chapters = Object.keys(KJV[currentBook]).map(Number);
  const idx = chapters.indexOf(currentChapter);
  const newIdx = idx + dir;

  if (newIdx >= 0 && newIdx < chapters.length) {
    loadChapter(currentBook, chapters[newIdx]);
  } else {
    // Jump books
    const books = Object.keys(KJV);
    const bookIdx = books.indexOf(currentBook);
    const newBookIdx = bookIdx + dir;
    if (newBookIdx >= 0 && newBookIdx < books.length) {
      const newBook = books[newBookIdx];
      const newCh = dir > 0? 1 : Math.max(...Object.keys(KJV[newBook]).map(Number));
      loadChapter(newBook, newCh);
    }
  }
}

// === 8. EXPORT/IMPORT HIGHLIGHTS ===
function exportData() {
  const data = {highlights, notes, exported: new Date().toISOString()};
  const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'kjv-notes-highlights.json';
  a.click();
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.highlights) highlights = data.highlights;
      if (data.notes) notes = data.notes;
      localStorage.setItem('kjv-highlights', JSON.stringify(highlights));
      localStorage.setItem('kjv-notes', JSON.stringify(notes));
      renderChapter();
      alert('Import successful');
    } catch(err) {
      alert('Invalid file');
    }
  };
  reader.readAsText(file);
}
