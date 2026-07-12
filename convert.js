const fs = require('fs');
const raw = eval(fs.readFileSync('bible.js','utf8') + '; KJV');
const KJV = {};
raw.verses.forEach(v => {
  if (!KJV[v.book_name]) KJV[v.book_name] = {};
  if (!KJV[v.book_name][v.chapter]) KJV[v.book_name][v.chapter] = {};
  KJV[v.book_name][v.chapter][v.verse] = v.text;
});
fs.writeFileSync('bible.js', 'const KJV = ' + JSON.stringify(KJV) + ';');
console.log('Done. Books:', Object.keys(KJV).length);
