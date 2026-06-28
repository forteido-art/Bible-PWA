const bookSel = document.getElementById('bookSelect');
const chapSel = document.getElementById('chapterSelect');
const versesDiv = document.getElementById('verseContainer');

// Add search + theme button to header
const header = document.querySelector('header');
const controls = document.createElement('div');
controls.className = 'controls';
controls.innerHTML = `
  <input id="searchInput" placeholder="Search Bible">
  <button id="searchBtn">Search</button>
  <button id="themeBtn">🌙</button>
`;
header.appendChild(controls);

const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const themeBtn = document.getElementById('themeBtn');

// Theme
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
themeBtn.textContent = savedTheme === 'dark'? '☀️' : '🌙';
themeBtn.onclick = () => {
  const newTheme = document.documentElement.getAttribute('data-theme') === 'dark'? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  themeBtn.textContent = newTheme === 'dark'? '☀️' : '🌙';
  localStorage.setItem('theme', newTheme);
};

// Populate books
Object.keys(KJV).forEach(book => {
  bookSel.add(new Option(book, book));
});

// Load chapters
function loadChapters() {
  const book = bookSel.value;
  chapSel.innerHTML = '';
  Object.keys(KJV).forEach(ch => {
    chapSel.add(new Option(ch, ch));
  });
  loadVerses();
}

// Load verses
function loadVerses() {
  const book = bookSel.value;
  const chap = chapSel.value;
  if (!KJV) return;
  versesDiv.innerHTML = `<h2 class="chapter-title">${book} ${chap}</h2>`;
  const verses = KJV[chap];
  Object.keys(verses).forEach(v => {
    const p = document.createElement('p');
    p.className = 'verse';
    p.id = `v${v}`;
    p.innerHTML = `<span class="verse-num">${v}</span>${verses[v]}`;
    p.onclick = () => {
      document.querySelectorAll('.verse').forEach(el => el.classList.remove('highlight'));
      p.classList.add('highlight');
      navigator.clipboard.writeText(`${book} ${chap}:${v} - ${verses[v]}`);
    };
    versesDiv.appendChild(p);
  });
}

// Search
function search() {
  const q = searchInput.value.trim().toLowerCase();
  if (q.length < 3) return versesDiv.innerHTML = '<p>Type 3+ characters to search</p>';
  versesDiv.innerHTML = '<h2 class="chapter-title">Search Results</h2>';
  let count = 0;
  for (const book in KJV) {
    for (const ch in KJV) {
      for (const v in KJV) {
        if (KJV.toLowerCase().includes(q)) {
          const div = document.createElement('div');
          div.className = 'search-result';
          div.innerHTML = `<div class="search-ref">${book} ${ch}:${v}</div>${KJV}`;
          div.onclick = () => {
            bookSel.value = book;
            loadChapters();
            chapSel.value = ch;
            loadVerses();
            setTimeout(() => {
              document.getElementById(`v${v}`)?.scrollIntoView({behavior:'smooth'});
              document.getElementById(`v${v}`)?.classList.add('highlight');
            }, 100);
          };
          versesDiv.appendChild(div);
          if (++count >= 100) {
            versesDiv.innerHTML += '<p>Showing first 100 results</p>';
            return;
          }
        }
      }
    }
  }
  if (count === 0) versesDiv.innerHTML += '<p>No results found</p>';
}

bookSel.onchange = loadChapters;
chapSel.onchange = loadVerses;
searchBtn.onclick = search;
searchInput.onkeypress = e => e.key === 'Enter' && search();

// Init
loadChapters();
