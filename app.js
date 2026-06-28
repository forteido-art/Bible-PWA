const bookSel = document.getElementById('bookSelect');
const chapSel = document.getElementById('chapterSelect');
const versesDiv = document.getElementById('verseContainer');

// Populate books
Object.keys(KJV).forEach(book => {
  const opt = document.createElement('option');
  opt.value = book;
  opt.textContent = book;
  bookSel.appendChild(opt);
});

// Populate chapters when book changes
function loadChapters() {
  const book = bookSel.value;
  chapSel.innerHTML = '';
  Object.keys(KJV[book]).forEach(ch => {
    const opt = document.createElement('option');
    opt.value = ch;
    opt.textContent = ch;
    chapSel.appendChild(opt);
  });
  loadVerses();
}

// Populate verses when chapter changes
function loadVerses() {
  const book = bookSel.value;
  const chap = chapSel.value;
  versesDiv.innerHTML = `<h2>${book} ${chap}</h2>`;
  const verses = KJV[book][chap];
  Object.keys(verses).forEach(v => {
    const p = document.createElement('p');
    p.innerHTML = `<b>${v}</b> ${verses[v]}`;
    versesDiv.appendChild(p);
  });
}

bookSel.addEventListener('change', loadChapters);
chapSel.addEventListener('change', loadVerses);

// Initial load
loadChapters();
