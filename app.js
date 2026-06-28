// === 1. GLOBALS ===
let KJV = {};
let currentBook = 'Genesis';
let currentChapter = 1;
let verseIndex = [];
let highlights = JSON.parse(localStorage.getItem('kjv-highlights') || '{}');
let notes = JSON.parse(localStorage.getItem('kjv-notes') || '{}');
let activeVerseId = null;

const GOSPELS = ['Matthew', 'Mark', 'Luke', 'John'];

// === 2. INIT ===
document.addEventListener('DOMContentLoaded', async () => {
  await loadBible();
  buildSearchIndex();
  setupEventListeners();
  restoreLastRead();
  renderBookSelector();
  renderChapterSelector();
  renderChapter();
  registerServiceWorker();
});

async function loadBible() {
  const script = document.createElement('script');
  script.src = './bible.js';
  document.head.appendChild(script);
  await new Promise(resolve => script.onload = resolve);
  KJV = window.KJV;
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
}

function restoreLastRead() {
  const last = JSON.parse(localStorage.getItem('kjv-last-read') || 'null');
  if (last && KJV[last.book]) {
    currentBook = last.book;
    currentChapter = last.chapter;
  }
}

// === 3. SEARCH INDEX - FIXED ===
function buildSearchIndex() {
  verseIndex = [];
  for (const book in KJV) {
    for (const ch in KJV[book]) {
      for (const v in KJV[book][ch]) {
        verseIndex.push({
          ref: `${book} ${ch}:${v}`,
          book, ch: +ch, v: +v,
          text: KJV[book][ch][v].toLowerCase(),
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
  .slice(0, limit);
}

// === 4. RENDERING - FIXED DROPDOWNS ===
function renderBookSelector() {
  const books = Object.keys(KJV);
  const select = document.getElementById('book-select');
  select.innerHTML = books.map(b => `<option value="${b}">${b}</option>`).join('');
  select.value = currentBook;
}

function renderChapterSelector() {
  const chapters = Object.keys(KJV[currentBook]).map(Number).sort((a,b)=>a-b);
  const select = document.getElementById('chapter-select');
  select.innerHTML = chapters.map(c => `<option value="${c}">${c}</option>`).join('');
  select.value = currentChapter;
}

function loadChapter(book, chapter) {
  currentBook = book;
  currentChapter = +chapter;
  localStorage.setItem('kjv-last-read', JSON.stringify({book, chapter}));
  renderChapterSelector();
  renderChapter();
  window.scrollTo({top: 0, behavior: 'smooth'});
}

function renderChapter() {
  const container = document.getElementById('verses');
  const verses = KJV[currentBook][currentChapter];
  const isGospel = GOSPELS.includes(currentBook);

  document.getElementById('current-ref').textContent = `${currentBook} ${currentChapter}`;

  container.innerHTML = Object.entries(verses).map(([v, text]) => {
    const id = `${currentBook}-${currentChapter}-${v}`;
    const isHighlighted = highlights[id];
    const hasNote = notes[id];

    let displayText = text;
    if (isGospel) {
      displayText = text.replace(/“([^”]+)”/g, '<span class="red">“$1”</span>');
    }

    return `
      <p class="verse ${isHighlighted? 'highlighted' : ''}" data-id="${id}">
        <sup>${v}</sup>${displayText}${hasNote? `<span class="note-icon" title="${escapeHtml(hasNote)}">📝</span>` : ''}
      </p>
    `;
  }).join('');
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

function showVerseModal(id) {
  activeVerseId = id;
  const [book, ch, v] = id.split('-');
  document.getElementById('modal-ref').textContent = `${book} ${ch}:${v}`;
  document.getElementById('note-input').value = notes[id] || '';
  document.getElementById('verse-modal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('verse-modal').style.display = 'none';
  activeVerseId = null;
}

// === 6. COPY WITH REFERENCE ===
document.addEventListener('copy', e => {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;

  let el = selection.anchorNode;
  if (el.nodeType === 3) el = el.parentElement;
  const verse = el.closest('.verse');
  if (!verse) return;

  const [book, ch, v] = verse.dataset.id.split('-');
  const text = selection.toString().trim().replace(/\s+/g, ' ');
  if (text) {
    e.clipboardData.setData('text/plain', `${text} — ${book} ${ch}:${v} KJV`);
    e.preventDefault();
  }
});

// === 7. EVENT LISTENERS ===
function setupEventListeners() {
  document.getElementById('book-select').onchange = e => loadChapter(e.target.value, 1);
  document.getElementById('chapter-select').onchange = e => loadChapter(currentBook, e.target.value);
  document.getElementById('prev-ch').onclick = () => navChapter(-1);
  document.getElementById('next-ch').onclick = () => navChapter(1);

  const searchInput = document.getElementById('search');
  const resultsDiv = document.getElementById('search-results');

  searchInput.oninput = e => {
    const results = searchVerses(e.target.value);
    if (!e.target.value ||!results.length) {
      resultsDiv.style.display = 'none';
      return;
    }
    resultsDiv.style.display = 'block';
    resultsDiv.innerHTML = results.map(r =>
      `<div class="search-result" data-book="${r.book}" data-ch="${r.ch}">
        <b>${r.ref}</b> ${r.text.slice(0, 120)}...
      </div>`
    ).join('');
  };

  resultsDiv.onclick = e => {
    const res = e.target.closest('.search-result');
    if (res) {
      loadChapter(res.dataset.book, res.dataset.ch);
      searchInput.value = '';
      resultsDiv.style.display = 'none';
    }
  };

  document.addEventListener('click', e => {
    if (!e.target.closest('.search-wrap')) resultsDiv.style.display = 'none';
  });

  document.getElementById('verses').onclick = e => {
    const verse = e.target.closest('.verse');
    if (verse) showVerseModal(verse.dataset.id);
  };

  document.getElementById('btn-highlight').onclick = () => {
    if (activeVerseId) toggleHighlight(activeVerseId);
    closeModal();
  };

  document.getElementById('btn-save-note').onclick = () => {
    if (activeVerseId) saveNote(activeVerseId, document.getElementById('note-input').value);
    closeModal();
  };

  document.getElementById('btn-close-modal').onclick = closeModal;
  document.getElementById('verse-modal').onclick = e => {
    if (e.target.id === 'verse-modal') closeModal();
  };

  document.getElementById('menu-btn').onclick = () => {
    const action = prompt('Menu:\n1 = Export Notes\n2 = Import Notes');
    if (action === '1') exportData();
    if (action === '2') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = e => importData(e.target.files[0]);
      input.click();
    }
  };
}

function navChapter(dir) {
  const chapters = Object.keys(KJV[currentBook]).map(Number).sort((a,b)=>a-b);
  const idx = chapters.indexOf(currentChapter);
  const newIdx = idx + dir;

  if (newIdx >= 0 && newIdx < chapters.length) {
    loadChapter(currentBook, chapters[newIdx]);
  } else {
    const books = Object.keys(KJV);
    const bookIdx = books.indexOf(currentBook);
    const newBookIdx = bookIdx + dir;
    if (newBookIdx >= 0 && newBookIdx < books.length) {
      const newBook = books[newBookIdx];
      const newChapters = Object.keys(KJV[newBook]).map(Number).sort((a,b)=>a-b);
      const newCh = dir > 0? newChapters[0] : newChapters[newChapters.length-1];
      loadChapter(newBook, newCh);
    }
  }
}

// === 8. EXPORT/IMPORT ===
function exportData() {
  const data = {highlights, notes, exported: new Date().toISOString(), version: 1};
  const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'kjv-notes.json'; a.click();
  URL.revokeObjectURL(url);
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      highlights = data.highlights || {};
      notes = data.notes || {};
      localStorage.setItem('kjv-highlights', JSON.stringify(highlights));
      localStorage.setItem('kjv-notes', JSON.stringify(notes));
      renderChapter();
      alert('Notes imported successfully');
    } catch(err) {
      alert('Invalid file format');
    }
  };
  reader.readAsText(file);
}
