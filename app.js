cat > app.js << 'EOF'
const bookSelect = document.getElementById('book');
const chapterSelect = document.getElementById('chapter');
const verseSelect = document.getElementById('verse');
const content = document.getElementById('content');
const searchInput = document.getElementById('search');
const searchBtn = document.getElementById('searchBtn');

// Load books
KJV.books.forEach((book, i) => {
  const opt = document.createElement('option');
  opt.value = i;
  opt.textContent = book.name;
  bookSelect.appendChild(opt);
});

// Load chapters when book changes
function loadChapters() {
  const bookIndex = bookSelect.value;
  chapterSelect.innerHTML = '';
  const chapters = KJV.books[bookIndex].chapters;
  chapters.forEach((_, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = i + 1;
    chapterSelect.appendChild(opt);
  });
  loadVerses();
}

// Load verses when chapter changes
function loadVerses() {
  const bookIndex = bookSelect.value;
  const chapterIndex = chapterSelect.value;
  verseSelect.innerHTML = '';

  const verses = KJV.books[bookIndex].chapters[chapterIndex];
  verses.forEach((_, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = i + 1;
    verseSelect.appendChild(opt);
  });
  showChapter();
}

// Display current chapter
function showChapter() {
  const b = bookSelect.value;
  const c = chapterSelect.value;
  const verses = KJV.books[b].chapters[c];
  const bookName = KJV.books[b].name;

  content.innerHTML = `<h2>${bookName} ${parseInt(c) + 1}</h2>` +
    verses.map((v, i) => `<p id="v${i+1}"><b>${i + 1}</b> ${v}</p>`).join('');

  // Scroll to selected verse if any
  if (verseSelect.value) {
    document.getElementById(`v${parseInt(verseSelect.value) + 1}`)?.scrollIntoView();
  }
}

// Jump to verse
function jumpToVerse() {
  const verseNum = parseInt(verseSelect.value) + 1;
  document.getElementById(`v${verseNum}`)?.scrollIntoView({behavior: 'smooth'});
}

// Search function
function searchBible() {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) return;

  content.innerHTML = '<h2>Search Results</h2>';
  let results = 0;

  KJV.books.forEach((book, b) => {
    book.chapters.forEach((chapter, c) => {
      chapter.forEach((verse, v) => {
        if (verse.toLowerCase().includes(query)) {
          results++;
          const div = document.createElement('p');
          div.innerHTML = `<b>${book.name} ${c + 1}:${v + 1}</b> ${verse}`;
          div.style.cursor = 'pointer';
          div.onclick = () => {
            bookSelect.value = b;
            loadChapters();
            setTimeout(() => {
              chapterSelect.value = c;
              loadVerses();
              setTimeout(() => {
                verseSelect.value = v;
                jumpToVerse();
              }, 50);
            }, 50);
          };
          content.appendChild(div);
        }
      });
    });
  });

  if (results === 0) content.innerHTML += '<p>No results found.</p>';
}

// Event listeners
bookSelect.onchange = loadChapters;
chapterSelect.onchange = loadVerses;
verseSelect.onchange = jumpToVerse;
searchBtn.onclick = searchBible;
searchInput.onkeypress = e => { if (e.key === 'Enter') searchBible(); };

// Init
loadChapters();

// PWA install prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}
EOF
