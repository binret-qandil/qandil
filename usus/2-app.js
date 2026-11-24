'use strict';
const ar = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const letters = ['أ', 'ب', 'ج', 'د'];
const data = { questions: window.QUESTIONS };
const key = 'ahmed-usus-20-v1';
const view = document.querySelector('#app');
let state, clock;
try { state = JSON.parse(localStorage.getItem(key)); } catch (e) {}
if (!state) state = { screen: 'intro' };

function save() { localStorage.setItem(key, JSON.stringify(state)); }
function left() { return Math.max(0, Math.ceil((state.deadline - Date.now()) / 1000)); }

function renderIntro() {
  view.innerHTML = `<h2>اختبار التأسيس: العمليات على الأسس حتى الأسس الصفرية</h2>
  <div class="facts"><span>${ar(data.questions.length)} سؤالًا</span><span>دقيقة واحدة لكل سؤال</span></div>
  <p>ابدأ السؤال، واختر إجابته قبل انتهاء الدقيقة. عند انتهاء الوقت تُغلق إجابة السؤال وينتقل الاختبار إلى السؤال التالي، ولا يُنقل الوقت المتبقي.</p>
  <p class="muted">تقدّمك محفوظ على هذا الجهاز فقط. لا نطلب اسم الطالب أو حسابًا.</p>
  <div class="actions"><button class="primary" id="start">ابدأ الاختبار</button>${state && state.screen === 'quiz' ? '<button id="resume">متابعة المحاولة</button>' : ''}</div>`;
  document.querySelector('#start').onclick = () => {
    state = { screen: 'quiz', current: 0, answers: Array(data.questions.length).fill(null), deadline: null, active: -1 };
    save(); renderQuiz();
  };
  let resume = document.querySelector('#resume');
  if (resume) resume.onclick = () => { catchUp(); render(); };
}

function catchUp() {
  if (state.screen !== 'quiz' || !state.deadline) return;
  while (Date.now() >= state.deadline && state.screen === 'quiz') {
    state.current++;
    state.deadline += 60000;
    if (state.current >= data.questions.length) state.screen = 'result';
  }
  save();
}

function render() {
  clearInterval(clock);
  if (state.screen === 'quiz') renderQuiz();
  else if (state.screen === 'result') renderResult();
  else renderIntro();
}

function renderQuiz() {
  catchUp();
  if (state.screen !== 'quiz') { renderResult(); return; }
  const q = data.questions[state.current];
  view.innerHTML = `<div class="bar"><span>السؤال ${ar(state.current + 1)} من ${ar(data.questions.length)}</span><span class="timer" id="timer"></span></div>
  <div class="question-reader"><img class="question" id="qimage" src="${q.img}" alt="السؤال ${ar(state.current + 1)}"></div>
  <button type="button" id="zoomQuestion">تكبير السؤال</button>
  <p class="muted">اختر الحرف المطابق للإجابة في الصورة.</p>
  <div class="opts">${letters.map((l, i) => `<button data-choice="${i}" class="${state.answers[state.current] === i ? 'selected' : ''}">${l}</button>`).join('')}</div>
  <div class="actions"><button class="primary" id="next">تأكيد الإجابة والتالي</button><button id="finish">إنهاء الاختبار</button></div>`;
  view.querySelectorAll('[data-choice]').forEach(b => b.onclick = () => {
    state.answers[state.current] = Number(b.dataset.choice);
    save();
    view.querySelectorAll('[data-choice]').forEach(x => x.classList.toggle('selected', x === b));
  });
  document.querySelector('#next').onclick = () => {
    state.current++;
    state.deadline = null;
    if (state.current >= data.questions.length) state.screen = 'result';
    save(); render();
  };
  document.querySelector('#finish').onclick = () => {
    if (confirm('إنهاء المحاولة الآن؟')) { state.screen = 'result'; save(); render(); }
  };
  document.querySelector('#zoomQuestion').onclick = () => {
    document.querySelector('#zoom img').src = q.img;
    document.querySelector('#zoom').showModal();
  };
  const img = document.querySelector('#qimage');
  if (state.active !== state.current) state.deadline = null;
  document.querySelector('#timer').textContent = 'تحميل السؤال';
  view.querySelectorAll('button').forEach(el => el.disabled = true);
  const ready = () => {
    if (!state.deadline) { state.deadline = Date.now() + 60000; state.active = state.current; save(); }
    view.querySelectorAll('button').forEach(el => el.disabled = false);
    tick(); clock = setInterval(tick, 200);
  };
  if (img.complete && img.naturalWidth) ready();
  else {
    img.onload = ready;
    img.onerror = () => { document.querySelector('#timer').textContent = 'تعذر التحميل، أعد فتح الصفحة'; };
  }
}

function tick() {
  const prev = state.current;
  catchUp();
  if (state.screen !== 'quiz' || state.current !== prev) { render(); return; }
  const t = left();
  const el = document.querySelector('#timer');
  if (el) {
    el.textContent = ar(Math.floor(t / 60)) + ':' + ar(String(t % 60).padStart(2, '0'));
    el.classList.toggle('low', t <= 10);
  }
}

function renderResult() {
  clearInterval(clock);
  const score = data.questions.reduce((s, q, i) => s + (state.answers[i] === q.correct ? 1 : 0), 0);
  view.innerHTML = `<h2>انتهت المحاولة</h2>
  <p>أجبت عن ${ar(state.answers.filter(x => x !== null).length)} من ${ar(data.questions.length)} سؤالًا.</p>
  <h2 class="score">${ar(score)} من ${ar(data.questions.length)}</h2>
  ${data.questions.map((q, i) => `<div class="resultrow">السؤال ${ar(i + 1)}: ${state.answers[i] === null ? 'بلا إجابة' : letters[state.answers[i]]} · الإجابة الصحيحة: ${letters[q.correct]}</div>`).join('')}
  <div class="actions"><button class="primary" id="restart">إعادة المحاولة</button></div>`;
  document.querySelector('#restart').onclick = () => { state = { screen: 'intro' }; save(); renderIntro(); };
}

render();
