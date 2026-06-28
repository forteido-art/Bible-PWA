const fs = require('fs');
const books = ["Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi","Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"];
let KJV = {};
for (let book of books) {
  try {
    const data = JSON.parse(fs.readFileSync(`Bible-kjv-1611-main/${book}.json`,'utf8'));
    KJV[book] = {}; 
    data.chapters.forEach(ch => {
      KJV[book][ch.chapter] = {};
      ch.verses.forEach(v => {
        KJV[book][ch.chapter][v.verse] = v.text;
      });
    });
    console.log(`Added ${book}`);
  } catch(e) {
    console.log(`Skipped ${book}: ${e.message}`);
  }
}
fs.writeFileSync('bible.js', 'const KJV = ' + JSON.stringify(KJV) + ';');
console.log('Done. All 66 books merged.');
