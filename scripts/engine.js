// Quiz logic with no DOM code, so it is easy to test.
function shuffle(list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// The word shown to the learner: Nepali or Doteli.
function targetText(card, lang) {
  return lang === "doteli" ? card.doteli : card.ne;
}

// One question: a card plus up to 4 answer options (the right one and 3 other cards).
function makeQuestion(type, card, pool, lang) {
  const wrong = shuffle(pool.filter((c) =>
    c.id !== card.id && targetText(c, lang) && targetText(c, lang) !== targetText(card, lang) && c.pic !== card.pic));
  return { type, card, options: shuffle([card, ...wrong.slice(0, 3)]), tries: 0 };
}

// Two questions per word: picture -> word, and word -> picture.
function buildQuestions(lessonCards, pool, lang) {
  const usable = lessonCards.filter((c) => targetText(c, lang));
  const qs = [];
  usable.forEach((c) => {
    qs.push(makeQuestion("pic2word", c, pool, lang));
    qs.push(makeQuestion("word2pic", c, pool, lang));
  });
  return shuffle(qs);
}

// Day streak: same day keeps it, the next day adds one, a gap resets to 1.
function nextStreak(lastDay, streak, today) {
  if (lastDay === today) return streak || 1;
  const y = new Date(today + "T00:00:00"); y.setDate(y.getDate() - 1);
  const yesterday = y.toLocaleDateString("en-CA");
  return lastDay === yesterday ? streak + 1 : 1;
}

if (typeof module !== "undefined") module.exports = { shuffle, targetText, makeQuestion, buildQuestions, nextStreak };