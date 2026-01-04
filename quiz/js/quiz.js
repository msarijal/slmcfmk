
function shuffleInPlace(arr) {
for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
}
return arr;
}

function prepareQuestions(rawQuestions) {
const qs = rawQuestions.map(q => ({ ...q, options: Array.isArray(q.options) ? [...q.options] : [] }));

// Randomize question order (each question appears exactly once)
shuffleInPlace(qs);

// Randomize options per question, while keeping the correct answer aligned
qs.forEach(q => {
    if (!Array.isArray(q.options) || q.options.length === 0) return;

    const answerText = (typeof q.answer_index === "number")
    ? q.options[q.answer_index]
    : (q.answer ?? null);

    const indexed = q.options.map(text => ({ text }));
    shuffleInPlace(indexed);
    q.options = indexed.map(x => x.text);

    if (answerText !== null) {
    const newIdx = q.options.findIndex(t => t === answerText);
    q.answer_index = newIdx;
    q.answer = answerText;
    }
});

return qs;
}

const QUIZ = window.QUIZ;
if (!QUIZ || !Array.isArray(QUIZ.questions)) {
  throw new Error("Missing quiz data. Ensure window.QUIZ is set before loading quiz/js/quiz.js");
}

const total = QUIZ.questions.length;
const QUESTIONS = prepareQuestions(QUIZ.questions);

const els = {
btnBack: document.getElementById("btnBack"),
pillPos: document.getElementById("pillPos"),
pillAnswered: document.getElementById("pillAnswered"),
bar: document.getElementById("bar"),
qText: document.getElementById("qText"),
qNum: document.getElementById("qNum"),
opts: document.getElementById("opts"),
hint: document.getElementById("hint"),
saved: document.getElementById("saved"),
btnPrev: document.getElementById("btnPrev"),
btnNext: document.getElementById("btnNext"),
btnCheck: document.getElementById("btnCheck"),
btnFinish: document.getElementById("btnFinish"),
btnReset: document.getElementById("btnReset"),
btnJumpUnanswered: document.getElementById("btnJumpUnanswered"),
quizCard: document.getElementById("quizCard"),
resultsCard: document.getElementById("resultsCard"),
resultsBody: document.querySelector("#resultsTable tbody"),
statRight: document.getElementById("statRight"),
statWrong: document.getElementById("statWrong"),
statAnswered: document.getElementById("statAnswered"),
scoreLine: document.getElementById("scoreLine"),
btnBackToQuiz: document.getElementById("btnBackToQuiz"),
btnPrint: document.getElementById("btnPrint"),
};

// answers[idx] = chosen option index (number) or null
const answers = Array(total).fill(null);

let idx = 0;
let checkedThis = false;

function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

function answeredCount() {
return answers.filter(v => typeof v === "number").length;
}

function computeScore() {
let right = 0, wrong = 0, answered = 0;
QUESTIONS.forEach((q, i) => {
    const a = answers[i];
    if (typeof a === "number") {
    answered++;
    if (a === q.answer_index) right++;
    else wrong++;
    }
});
return { right, wrong, answered };
}

function setTop() {
els.pillPos.textContent = `Question ${idx + 1} / ${total}`;
els.pillAnswered.textContent = `Answered: ${answeredCount()} / ${total}`;
els.bar.style.width = `${((idx + 1) / total) * 100}%`;

els.btnPrev.disabled = idx === 0;
els.btnNext.disabled = idx === total - 1;

const score = computeScore();
const allAnswered = score.answered === total;
els.btnFinish.textContent = allAnswered ? "Finish & see results" : `Finish (answered ${score.answered}/${total})`;
}

function renderQuestion() {
checkedThis = false;
const q = QUESTIONS[idx];
els.qText.textContent = q.question;
els.qNum.textContent = `Q${q.id}`;

els.opts.innerHTML = "";
const name = "q_" + idx;

const current = answers[idx];

q.options.forEach((opt, oi) => {
    const label = document.createElement("label");
    label.className = "opt";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = name;
    input.value = String(oi);

    if (current === oi) {
    input.checked = true;
    label.classList.add("selected");
    }

    const span = document.createElement("span");
    span.textContent = opt;

    label.appendChild(input);
    label.appendChild(span);

    label.addEventListener("click", () => {
    // Save answer
    answers[idx] = oi;
    // Visual selected state
    Array.from(els.opts.querySelectorAll(".opt")).forEach(o => o.classList.remove("selected", "correct", "wrong"));
    label.classList.add("selected");

    els.saved.textContent = "Saved ✅";
    els.hint.textContent = "You can go Next, or press “Check this answer”.";
    setTop();
    });

    els.opts.appendChild(label);
});

if (typeof current === "number") {
    els.saved.textContent = "Saved ✅";
    els.hint.textContent = "You can change your answer anytime.";
} else {
    els.saved.textContent = "Not answered yet.";
    els.hint.textContent = "Pick one answer, then press Next.";
}

setTop();
}

function checkThis() {
const q = QUESTIONS[idx];
const chosen = answers[idx];

// Clear marks
const optionEls = Array.from(els.opts.querySelectorAll(".opt"));
optionEls.forEach(o => o.classList.remove("correct", "wrong"));

if (typeof q.answer_index === "number") {
    optionEls[q.answer_index]?.classList.add("correct");
}

if (typeof chosen === "number") {
    if (typeof q.answer_index === "number" && chosen !== q.answer_index) {
    optionEls[chosen]?.classList.add("wrong");
    els.hint.textContent = "Not quite — the correct answer is highlighted ✅";
    } else {
    els.hint.textContent = "Correct! ✅";
    }
} else {
    els.hint.textContent = "Choose an option first 🙂";
}

checkedThis = true;
}

function go(n) {
idx = clamp(n, 0, total - 1);
renderQuestion();
}

function nextUnanswered() {
for (let i = idx + 1; i < total; i++) {
    if (answers[i] === null) return go(i);
}
for (let i = 0; i < total; i++) {
    if (answers[i] === null) return go(i);
}
// If none, stay
els.hint.textContent = "All questions are answered ✅ You can finish now.";
}

function showResults() {
const score = computeScore();
els.statRight.textContent = String(score.right);
els.statWrong.textContent = String(score.wrong);
els.statAnswered.textContent = `${score.answered} / ${total}`;
els.scoreLine.textContent = `Score: ${score.right} / ${total}`;

els.resultsBody.innerHTML = "";

QUESTIONS.forEach((q, i) => {
    const tr = document.createElement("tr");

    const chosenIdx = answers[i];
    const chosenText = (typeof chosenIdx === "number") ? q.options[chosenIdx] : "—";
    const correctText = (typeof q.answer_index === "number") ? q.options[q.answer_index] : (q.answer ?? "—");
    const isRight = (typeof chosenIdx === "number" && typeof q.answer_index === "number" && chosenIdx === q.answer_index);

    tr.innerHTML = `
    <td>${i + 1}</td>
    <td>${escapeHtml(q.question)}</td>
    <td>${escapeHtml(correctText)}</td>
    <td>${escapeHtml(chosenText)}</td>
    <td>${isRight ? '<span class="tag good">Right ✅</span>' : (chosenIdx === null ? '<span class="tag bad">Not answered</span>' : '<span class="tag bad">Wrong ❌</span>')}</td>
    `;
    els.resultsBody.appendChild(tr);
});

// swap views
els.quizCard.style.display = "none";
els.resultsCard.classList.add("show");
els.resultsCard.style.display = "block";
window.scrollTo({ top: 0, behavior: "smooth" });
}

function backToQuiz() {
els.resultsCard.classList.remove("show");
els.resultsCard.style.display = "none";
els.quizCard.style.display = "block";
renderQuestion();
window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetAll() {
for (let i = 0; i < total; i++) answers[i] = null;
idx = 0;
renderQuestion();
els.hint.textContent = "All cleared. Start again 🙂";
}

function escapeHtml(str) {
return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Buttons
els.btnBack?.addEventListener("click", () => {
if (window.history.length > 1) {
    window.history.back();
} else {
    window.location.href = "../index.html";
}
});
els.btnPrev.addEventListener("click", () => go(idx - 1));
els.btnNext.addEventListener("click", () => go(idx + 1));
els.btnCheck.addEventListener("click", () => checkThis());
els.btnJumpUnanswered.addEventListener("click", () => nextUnanswered());
els.btnFinish.addEventListener("click", () => showResults());
els.btnBackToQuiz.addEventListener("click", () => backToQuiz());
els.btnPrint.addEventListener("click", () => window.print());
els.btnReset.addEventListener("click", () => resetAll());

// Keyboard support (desktop)
document.addEventListener("keydown", (e) => {
if (els.quizCard.style.display === "none") return;
if (e.key === "ArrowLeft") go(idx - 1);
if (e.key === "ArrowRight") go(idx + 1);
});

// Initial render
renderQuestion();
