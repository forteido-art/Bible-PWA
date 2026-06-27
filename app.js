const bookSelect = document.getElementById('bookSelect');
const chapterSelect = document.getElementById('chapterSelect');
const verseContainer = document.getElementById('verseContainer');

// Load books
Object.keys(BIBLE).forEach(book => {
  const opt = document.createElement('option');
  opt.value = book;
  opt.textContent = book;
  bookSelect.appendChild(opt);
});

function loadChapters() {
  const book = bookSelect.value;
  chapterSelect.innerHTML = '';
  Object.keys(BIBLE[book]).forEach(ch => {
    const opt = document.createElement('option');
    opt.value = ch;
    opt.textContent = `Chapter ${ch}`;
    chapterSelect.appendChild(opt);
  });
  loadVerses();
}

function loadVerses() {
  const book = bookSelect.value;
  const chapter = chapterSelect.value;
  const verses = BIBLE[book][chapter];
  verseContainer.innerHTML = '';
  Object.keys(verses).forEach(num => {
    const p = document.createElement('p');
    p.className = 'verse';
    p.innerHTML = `<span class="verse-num">${num}</span>${verses[num]}`;
    verseContainer.appendChild(p);
  });
}

bookSelect.addEventListener('change', loadChapters);
chapterSelect.addEventListener('change', loadVerses);

// Init
loadChapters();
