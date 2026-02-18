const DEFAULT_DATA_FILE2 = "slmcfmk_quiz_dec2025.json";
    const DEFAULT_DATA_FILE = "ram_quiz.json";

    function getEmbeddedQuizJson() {
      try {
        return (window.EMBEDDED_QUIZ && typeof window.EMBEDDED_QUIZ === "object") ? window.EMBEDDED_QUIZ : null;
      } catch {
        return null;
      }
    }
    function storageKeyFor(dataFile) {
      return `ramadhan_quiz_state::${dataFile}`;
    }

    const els = {
      splash: document.getElementById("splash"),
      splashTitle: document.getElementById("splashTitle"),
      btnStart: document.getElementById("btnStart"),
      btnStartGame: document.getElementById("btnStartGame"),
      splashRules: document.getElementById("splashRules"),
      gameRoot: document.getElementById("gameRoot"),
      appFrame: document.getElementById("appFrame"),
      pillPos: document.getElementById("pillPos"),
      levelTag: document.getElementById("levelTag"),
      levelRow: document.getElementById("levelRow"),
      levelTitle: document.getElementById("levelTitle"),
      teamsList: document.getElementById("teamsList"),
      questionCard: document.getElementById("questionCard"),
      scorePills: document.getElementById("scorePills"),
      scoreA: document.getElementById("scoreA"),
      scoreB: document.getElementById("scoreB"),
      scoreC: document.getElementById("scoreC"),
      scoreD: document.getElementById("scoreD"),
      questionText: document.getElementById("questionText"),
      answers: document.getElementById("answers"),
      players: document.getElementById("players"),
      hint: document.getElementById("hint"),
      btnNext: document.getElementById("btnNext"),
      btnRestart: document.getElementById("btnRestart"),
      btnVoice: document.getElementById("btnVoice"),
      voiceStatus: document.getElementById("voiceStatus"),
      btnScores: document.getElementById("btnScores"),
      btnShowChoices: document.getElementById("btnShowChoices"),
      btnShowAnswer: document.getElementById("btnShowAnswer"),
      overlay: document.getElementById("overlay"),
      overlayTitle: document.getElementById("overlayTitle"),
      overlayText: document.getElementById("overlayText"),
      overlayBtn: document.getElementById("overlayBtn"),
      fireworks: document.getElementById("fireworks"),
    };

    function applyQuizMeta(json, dataFile) {
      const title = (json && typeof json.title === "string" && json.title.trim()) ? json.title.trim() : (dataFile || "Quiz");

      try {
        document.title = title;
      } catch {}

      if (els.splashTitle) els.splashTitle.textContent = `Welcome to ${title}`;
      if (els.levelTitle) els.levelTitle.textContent = title;
      if (els.appFrame) els.appFrame.setAttribute("aria-label", title);

      const teams = (json && Array.isArray(json.Teams))
        ? json.Teams
        : ((json && Array.isArray(json.teams)) ? json.teams : null);

      if (els.teamsList && Array.isArray(teams)) {
        els.teamsList.innerHTML = "";
        teams.forEach((t) => {
          if (!t || typeof t !== "object") return;
          const teamName = (typeof t.Team === "string" ? t.Team : (typeof t.team === "string" ? t.team : "")).trim();
          const leaderName = (typeof t.Leader === "string" ? t.Leader : (typeof t.leader === "string" ? t.leader : "")).trim();
          if (!teamName && !leaderName) return;

          const row = document.createElement("div");
          if (teamName && leaderName) row.textContent = `${teamName} – Leader: ${leaderName}`;
          else if (teamName) row.textContent = teamName;
          else row.textContent = leaderName;
          els.teamsList.appendChild(row);
        });
      }
    }

    function getDataFile() {
      const url = new URL(window.location.href);
      return url.searchParams.get("data") || DEFAULT_DATA_FILE;
    }

    function showOverlay(title, text) {
      els.overlayTitle.textContent = title;
      els.overlayText.textContent = text;
      els.overlay.classList.add("show");
      els.overlay.setAttribute("aria-hidden", "false");
      els.overlayBtn.focus();
    }

    function showOverlayHtml(title, html) {
      els.overlayTitle.textContent = title;
      els.overlayText.innerHTML = html;
      els.overlay.classList.add("show");
      els.overlay.setAttribute("aria-hidden", "false");
      els.overlayBtn.focus();
    }

    let fireworksRAF = null;
    let fireworksParticles = [];
    let fireworksLast = 0;
    let fireworksNextBurstAt = 0;

    function resizeFireworksCanvas() {
      if (!els.fireworks) return;
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      const w = Math.floor(window.innerWidth);
      const h = Math.floor(window.innerHeight);
      els.fireworks.width = Math.floor(w * dpr);
      els.fireworks.height = Math.floor(h * dpr);
      const ctx = els.fireworks.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawnBurst() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const x = Math.random() * w;
      const y = (Math.random() * 0.45 + 0.1) * h;
      const colors = ["#F59E0B", "#22C55E", "#60A5FA", "#F472B6", "#A78BFA", "#FBBF24"]; 
      const color = colors[(Math.random() * colors.length) | 0];
      const count = 42 + ((Math.random() * 26) | 0);
      for (let i = 0; i < count; i++) {
        const a = (Math.PI * 2 * i) / count + (Math.random() * 0.15);
        const sp = 140 + Math.random() * 220;
        fireworksParticles.push({
          x, y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          life: 1,
          r: 2 + Math.random() * 2.5,
          color,
        });
      }
    }

    function startFireworks() {
      if (!els.fireworks) return;
      stopFireworks();
      resizeFireworksCanvas();
      fireworksParticles = [];
      fireworksLast = performance.now();
      fireworksNextBurstAt = fireworksLast + 50;

      const ctx = els.fireworks.getContext("2d");
      if (!ctx) return;

      const step = (t) => {
        fireworksRAF = requestAnimationFrame(step);
        const dt = Math.min(0.033, (t - fireworksLast) / 1000);
        fireworksLast = t;

        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        if (t >= fireworksNextBurstAt) {
          spawnBurst();
          fireworksNextBurstAt = t + 350 + Math.random() * 650;
        }

        const g = 380;
        for (let i = fireworksParticles.length - 1; i >= 0; i--) {
          const p = fireworksParticles[i];
          p.vy += g * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vx *= (1 - 1.8 * dt);
          p.vy *= (1 - 0.6 * dt);
          p.life -= 0.9 * dt;

          if (p.life <= 0) {
            fireworksParticles.splice(i, 1);
            continue;
          }

          ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      };

      fireworksRAF = requestAnimationFrame(step);
      window.addEventListener("resize", resizeFireworksCanvas);
    }

    function stopFireworks() {
      if (fireworksRAF) cancelAnimationFrame(fireworksRAF);
      fireworksRAF = null;
      fireworksParticles = [];
      window.removeEventListener("resize", resizeFireworksCanvas);
      if (els.fireworks) {
        const ctx = els.fireworks.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      }
    }

    function hideOverlay() {
      els.overlay.classList.remove("show");
      els.overlay.setAttribute("aria-hidden", "true");
      stopFireworks();
    }

    els.overlayBtn.addEventListener("click", hideOverlay);

    function shuffleInPlace(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }

    function sortQuestionsByIdInPlace(qs) {
      qs.sort((a, b) => {
        const al = (typeof a?.level === "number") ? a.level : parseInt(a?.level ?? "1", 10) || 1;
        const bl = (typeof b?.level === "number") ? b.level : parseInt(b?.level ?? "1", 10) || 1;
        if (al !== bl) return al - bl;

        const ai = (typeof a?.id === "number") ? a.id : parseInt(a?.id ?? "0", 10) || 0;
        const bi = (typeof b?.id === "number") ? b.id : parseInt(b?.id ?? "0", 10) || 0;
        return ai - bi;
      });
      return qs;
    }

    function normalizeQuestions(rawQuestions) {
      const qs = (Array.isArray(rawQuestions) ? rawQuestions : [])
        .filter(q => q && typeof q === "object")
        .map(q => ({
          id: q.id ?? null,
          level: (typeof q.level === "number") ? q.level : (Number.isFinite(parseInt(q.level, 10)) ? parseInt(q.level, 10) : 1),
          question: String(q.question ?? ""),
          options: Array.isArray(q.options) ? q.options.map(x => String(x)) : [],
          answer_index: (typeof q.answer_index === "number") ? q.answer_index : null,
          answer: (typeof q.answer === "string") ? q.answer : null,
        }));

      sortQuestionsByIdInPlace(qs);

      qs.forEach(q => {
        if (!Array.isArray(q.options) || q.options.length !== 4) return;

        const answerText = (typeof q.answer_index === "number")
          ? q.options[q.answer_index]
          : (q.answer ?? null);

        const options = q.options.map(text => ({ text }));
        shuffleInPlace(options);
        q.options = options.map(o => o.text);

        if (answerText !== null) {
          q.answer_index = q.options.findIndex(t => t === answerText);
          q.answer = answerText;
        }
      });

      return qs.filter(q => q.question && Array.isArray(q.options) && q.options.length === 4 && typeof q.answer_index === "number" && q.answer_index >= 0);
    }

    let QUIZ = null;
    let QUESTIONS = [];
    let idx = 0;
    let focused = 0;
    let locked = false;
    let chosenIndex = null;

    const PLAYER_LABELS = ["A", "B", "C", "D"];
    const playerScores = [0, 0, 0, 0];
    let playerPicks = [null, null, null, null];
    let activePlayer = 0;
    let revealed = false;
    let scoredThisQuestion = false;
    let stage = "question"; // question | choices | revealed
    let selectedLevel = null;
    let levelIndices = [];
    let lastIdxByLevel = { 1: null, 2: null, 3: null };

    function loadState(dataFile) {
      try {
        const raw = window.localStorage.getItem(storageKeyFor(dataFile));
        if (!raw) return null;
        const st = JSON.parse(raw);
        if (!st || typeof st !== "object") return null;
        if (st.dataFile !== dataFile) return null;
        if (!Array.isArray(st.playerScores) || st.playerScores.length !== 4) return null;
        if (typeof st.idx !== "number") return null;
        return st;
      } catch {
        return null;
      }
    }

    function saveState(dataFile) {
      try {
        const st = {
          v: 1,
          dataFile,
          savedAt: Date.now(),
          idx,
          selectedLevel,
          lastIdxByLevel: { ...lastIdxByLevel },
          activePlayer,
          playerScores: [...playerScores],
          playerPicks: [...playerPicks],
          stage,
        };
        window.localStorage.setItem(storageKeyFor(dataFile), JSON.stringify(st));
      } catch {
        // ignore
      }
    }

    function clearState(dataFile) {
      try {
        window.localStorage.removeItem(storageKeyFor(dataFile));
      } catch {
        // ignore
      }
    }

    function setTop() {
      els.pillPos.textContent = `Q ${idx + 1} / ${QUESTIONS.length}`;
    }

    function renderScorePills() {
      if (els.scoreA) els.scoreA.textContent = `A: ${playerScores[0]}`;
      if (els.scoreB) els.scoreB.textContent = `B: ${playerScores[1]}`;
      if (els.scoreC) els.scoreC.textContent = `C: ${playerScores[2]}`;
      if (els.scoreD) els.scoreD.textContent = `D: ${playerScores[3]}`;
    }

    function setScoresVisible(visible) {
      if (!els.scorePills) return;
      if (visible) els.scorePills.classList.remove("hidden");
      else els.scorePills.classList.add("hidden");
    }

    function setEndedUi(ended) {
      els.btnNext.disabled = ended;
      els.btnShowChoices.disabled = ended;
      els.btnShowAnswer.disabled = ended;
      if (els.btnScores) els.btnScores.disabled = false;
    }

    function endGameNow() {
      const max = Math.max(...playerScores);
      const winners = PLAYER_LABELS.filter((_, i) => playerScores[i] === max);
      const winnerText = (winners.length === 1)
        ? `Winner is ${winners[0]}`
        : `Winners are ${winners.join(" & ")}`;
      const scoresHtml = `
        <div class="winnerScores" aria-label="Final scores">
          <div class="winnerScoreCircle"><div class="winnerScoreLabel">A</div><div class="winnerScoreValue">${playerScores[0]}</div></div>
          <div class="winnerScoreCircle"><div class="winnerScoreLabel">B</div><div class="winnerScoreValue">${playerScores[1]}</div></div>
          <div class="winnerScoreCircle"><div class="winnerScoreLabel">C</div><div class="winnerScoreValue">${playerScores[2]}</div></div>
          <div class="winnerScoreCircle"><div class="winnerScoreLabel">D</div><div class="winnerScoreValue">${playerScores[3]}</div></div>
        </div>`;
      showOverlayHtml(
        "Game Over. Hope You All Enjoyed The Quiz!",
        `<div class="winnerLine">${winnerText}</div>${scoresHtml}`
      );
      startFireworks();
      setEndedUi(true);
    }

    function startGame() {
      if (els.splash) els.splash.classList.add("splashHidden");
      if (els.gameRoot) els.gameRoot.classList.add("show");
      const target = (!els.btnNext.disabled) ? els.btnNext : els.btnShowChoices;
      target?.focus();
    }

    function showSplashRules() {
      if (els.splashRules) els.splashRules.classList.remove("splashRulesHidden");
      if (els.btnStart) els.btnStart.classList.add("hidden");
      if (els.btnStartGame) els.btnStartGame.classList.remove("hidden");
      els.btnStartGame?.focus();
    }

    const Voice = {
      recognition: null,
      enabled: false,
      supported: false,
      starting: false,
    };

    function setVoiceStatus(text) {
      return;
    }

    function setVoiceHeard(text) {
      return;
    }

    function canExecuteVoiceActions() {
      if (!els.splash || !els.gameRoot) return true;
      const inSplash = !els.splash.classList.contains("splashHidden");
      const gameVisible = els.gameRoot.classList.contains("show");
      return !inSplash && gameVisible;
    }

    function executeVoiceCommand(command) {
      if (!canExecuteVoiceActions()) return;
      if (els.overlay && els.overlay.classList.contains("show")) return;

      if (command === "select next" || command === "next") {
        els.btnNext?.click();
        return;
      }
      if (command === "show answers" || command === "show choices") {
        els.btnShowChoices?.click();
        return;
      }
      if (command === "show answer" || command === "correct answer") {
        if (!els.btnShowAnswer?.disabled) els.btnShowAnswer?.click();
        return;
      }
      if (command === "show score" || command === "the score") {
        els.btnScores?.click();
        return;
      }
    }

    function parseTranscriptToCommand(t) {
      const s = String(t || "").toLowerCase().replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();
      const i = s.indexOf("computer g");
      if (i < 0) return null;
      const after = s.slice(i + "computer g".length).trim();
      if (!after) return null;

      // Ignore extra filler words; just look for keywords/phrases anywhere after the wake phrase.
      const a = after;

      if (a.includes("select next") || a.includes("next please") || a.includes("next question") || a.includes("next")) {
        return "select next";
      }

      // Choices / answers list
      if (
        a.includes("the choices") ||
        a.includes("show choice") ||
        a.includes("show answers") ||
        a.includes("options") ||
        a.includes("option") ||
        a.includes("choices") ||
        a.includes("choice") ||
        a.includes("chices")
      ) {
        return "show choices";
      }

      // Correct answer
      if (a.includes("correct answer") || a.includes("show answer") || a.includes("the answer")) {
        return "correct answer";
      }

      // Scores
      if (a.includes("show score") || a.includes("the score") || a.includes("score") || a.includes("scores")) {
        return "show score";
      }

      return null;
    }

    function initVoiceControl() {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      Voice.supported = Boolean(SR);
      if (!Voice.supported) {
        setVoiceStatus("Voice: Unsupported");
        if (els.btnVoice) els.btnVoice.disabled = true;
        return;
      }

      const rec = new SR();
      Voice.recognition = rec;
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => {
        Voice.starting = false;
        els.btnVoice?.classList.add("btnVoiceActive");
        setVoiceStatus("Voice: Listening");
      };
      rec.onend = () => {
        if (!Voice.enabled) {
          els.btnVoice?.classList.remove("btnVoiceActive");
          setVoiceStatus("Voice: Off");
          return;
        }
        setVoiceStatus("Voice: Restarting");
        window.setTimeout(() => {
          if (!Voice.enabled) return;
          try { rec.start(); } catch {}
        }, 250);
      };
      rec.onerror = () => {
        if (!Voice.enabled) return;
        setVoiceStatus("Voice: Error");
      };
      rec.onresult = (e) => {
        const last = e.results?.[e.results.length - 1];
        const txt = last?.[0]?.transcript ?? "";
        try {
          console.log("[Voice] transcript:", txt);
        } catch {}
        setVoiceHeard(txt);
        const cmd = parseTranscriptToCommand(txt);
        try {
          console.log("[Voice] parsed command:", cmd);
        } catch {}
        if (cmd) executeVoiceCommand(cmd);
      };

      setVoiceStatus("Voice: Off");
    }

    function toggleVoice() {
      if (!Voice.supported || !Voice.recognition) return;
      Voice.enabled = !Voice.enabled;
      if (!Voice.enabled) {
        els.btnVoice?.classList.remove("btnVoiceActive");
        setVoiceStatus("Voice: Off");
        try { Voice.recognition.stop(); } catch {}
        return;
      }
      if (Voice.starting) return;
      Voice.starting = true;
      setVoiceStatus("Voice: Starting");
      try { Voice.recognition.start(); } catch {
        Voice.starting = false;
        setVoiceStatus("Voice: Error");
      }
    }

    function rebuildLevelIndices() {
      if (!selectedLevel) {
        levelIndices = [];
        return;
      }
      levelIndices = [];
      for (let i = 0; i < QUESTIONS.length; i++) {
        const q = QUESTIONS[i];
        const lvl = (typeof q.level === "number") ? q.level : parseInt(q.level ?? "1", 10) || 1;
        if (lvl === selectedLevel) levelIndices.push(i);
      }
    }

    function renderLevelRow() {
      if (!els.levelRow) return;
      els.levelRow.innerHTML = "";
      [1, 2, 3].forEach((lvl) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "levelBtn" + (selectedLevel === lvl ? " levelBtnActive" : "");
        b.textContent = `Level ${lvl}`;
        b.addEventListener("click", () => {
          if (selectedLevel) {
            lastIdxByLevel[selectedLevel] = idx;
          }
          if (selectedLevel === lvl) {
            selectedLevel = null;
          } else {
            selectedLevel = lvl;
          }
          rebuildLevelIndices();
          if (selectedLevel) {
            if (!levelIndices.length) {
              selectedLevel = null;
              rebuildLevelIndices();
              renderLevelRow();
              setTop();
              saveState(getDataFile());
              showOverlay("No questions", `No questions found for Level ${lvl}.`);
              return;
            }

            const remembered = lastIdxByLevel[selectedLevel];
            if (typeof remembered === "number" && levelIndices.includes(remembered)) {
              idx = remembered;
            } else {
              idx = levelIndices[0];
              lastIdxByLevel[selectedLevel] = idx;
            }

            renderQuestion();
          }
          renderLevelRow();
          setTop();
          saveState(getDataFile());
        });
        els.levelRow.appendChild(b);
      });
    }

    function getNextIndex() {
      if (selectedLevel && levelIndices.length) {
        const pos = levelIndices.indexOf(idx);
        const nextPos = (pos >= 0) ? ((pos + 1) % levelIndices.length) : 0;
        return levelIndices[nextPos];
      }
      return idx + 1;
    }

    function clearFocusClasses() {
      const cards = Array.from(els.answers.querySelectorAll(".ans"));
      cards.forEach((c) => {
        c.classList.remove("ansFocus", "ansSelected");
        c.setAttribute("aria-disabled", locked ? "true" : "false");
      });
    }

    function applyFocus() {
      clearFocusClasses();
      const cards = Array.from(els.answers.querySelectorAll(".ans"));
      cards.forEach((c, i) => {
        if (focused >= 0 && i === focused) c.classList.add("ansFocus");
        if ((stage === "revealed" || revealed) && chosenIndex === i) c.classList.add("ansSelected");
      });
    }

    function renderQuestion() {
      if (!QUESTIONS.length) return;

      locked = false;
      chosenIndex = null;
      els.btnNext.disabled = false;
      els.hint.textContent = "";
      revealed = false;
      scoredThisQuestion = false;
      playerPicks = [null, null, null, null];
      stage = "question";
      els.answers.classList.add("concealed");
      els.players.classList.add("concealed");
      els.btnShowChoices.disabled = false;
      els.btnShowAnswer.disabled = true;

      const q = QUESTIONS[idx];
      els.questionText.textContent = q.question;
      els.levelTag.textContent = "";

      const letters = ["1", "2", "3", "4"];
      els.answers.innerHTML = "";

      q.options.forEach((text, i) => {
        const btn = document.createElement("div");
        btn.className = "ans";
        btn.setAttribute("role", "button");
        btn.setAttribute("tabindex", "-1");
        btn.setAttribute("aria-disabled", "false");
        btn.dataset.index = String(i);

        const badge = document.createElement("div");
        badge.className = "badge";
        badge.textContent = letters[i];

        const span = document.createElement("div");
        span.className = "ansText";
        span.textContent = text;

        btn.appendChild(badge);
        btn.appendChild(span);

        btn.addEventListener("click", () => {
          focused = i;
          chooseFocused();
        });

        els.answers.appendChild(btn);
      });

      focused = -1;
      setTop();
      applyFocus();

      renderPlayers();

      saveState(getDataFile());
    }

    function showChoices() {
      if (!QUESTIONS.length) return;
      if (stage !== "question") return;
      stage = "choices";
      els.answers.classList.remove("concealed");
      els.players.classList.remove("concealed");
      els.btnShowChoices.disabled = true;
      els.btnShowAnswer.disabled = false;
      activePlayer = 0;
      focused = -1;
      applyFocus();
      renderPlayers();
      saveState(getDataFile());
    }

    function renderPlayers() {
      els.players.innerHTML = "";
      PLAYER_LABELS.forEach((label, pi) => {
        const c = document.createElement("div");
        c.className = "playerCircle" + (pi === activePlayer ? " playerCircleActive" : "");
        c.setAttribute("role", "button");
        c.setAttribute("tabindex", "-1");
        c.dataset.player = String(pi);

        const t = document.createElement("div");
        t.className = "playerLabel";
        t.textContent = label;

        c.appendChild(t);

        const pick = playerPicks[pi];
        if ((stage === "choices" || stage === "revealed" || revealed) && typeof pick === "number") {
          const p = document.createElement("div");
          p.className = "playerPick";
          if (stage === "revealed" || revealed) p.textContent = String(pick + 1);
          c.appendChild(p);
        }

        c.addEventListener("click", () => {
          if (revealed) return;
          activePlayer = pi;
          renderPlayers();
        });

        els.players.appendChild(c);
      });
    }

    function chooseFocused() {
      const q = QUESTIONS[idx];
      const cards = Array.from(els.answers.querySelectorAll(".ans"));

      if (revealed) return;
      if (stage !== "choices") return;

      chosenIndex = focused;

      // Save this player's pick (no red/green highlighting at this stage)
      playerPicks[activePlayer] = chosenIndex;
      renderPlayers();

      // Keep answers clickable until reveal
      cards.forEach((c) => c.setAttribute("aria-disabled", "false"));

      setTop();
      focused = -1;
      applyFocus();

      saveState(getDataFile());
    }

    function showAnswer() {
      if (!QUESTIONS.length) return;
      if (revealed) return;
      if (stage !== "choices") return;

      revealed = true;
      stage = "revealed";

      const q = QUESTIONS[idx];
      const cards = Array.from(els.answers.querySelectorAll(".ans"));

      // Highlight only the correct answer in green
      cards.forEach((c) => c.classList.remove("ansWrong", "ansCorrect"));
      cards[q.answer_index]?.classList.add("ansCorrect");
      cards.forEach((c) => c.setAttribute("aria-disabled", "true"));

      // Score: +2 for each player who picked correctly
      if (!scoredThisQuestion) {
        playerPicks.forEach((pick, pi) => {
          if (typeof pick === "number" && pick === q.answer_index) playerScores[pi] += 2;
        });
        scoredThisQuestion = true;
      }

      els.btnNext.disabled = false;
      renderScorePills();
      setTop();
      renderPlayers();

      saveState(getDataFile());
    }

    function nextQuestion() {
      if (!QUESTIONS.length) return;
      if (!selectedLevel && idx >= QUESTIONS.length - 1) {
        const max = Math.max(...playerScores);
        const winners = PLAYER_LABELS.filter((_, i) => playerScores[i] === max);
        const winnerText = (winners.length === 1)
          ? `Winner is ${winners[0]}`
          : `Winners are ${winners.join(" & ")}`;
        const scoresHtml = `
          <div class="winnerScores" aria-label="Final scores">
            <div class="winnerScoreCircle"><div class="winnerScoreLabel">A</div><div class="winnerScoreValue">${playerScores[0]}</div></div>
            <div class="winnerScoreCircle"><div class="winnerScoreLabel">B</div><div class="winnerScoreValue">${playerScores[1]}</div></div>
            <div class="winnerScoreCircle"><div class="winnerScoreLabel">C</div><div class="winnerScoreValue">${playerScores[2]}</div></div>
            <div class="winnerScoreCircle"><div class="winnerScoreLabel">D</div><div class="winnerScoreValue">${playerScores[3]}</div></div>
          </div>`;
        showOverlayHtml(
          "Game Over. Hope You All Enjoyed The Quiz!",
          `<div class="winnerLine">${winnerText}</div>${scoresHtml}`
        );
        startFireworks();
        return;
      }

      // Hide scores again when moving to next question
      setScoresVisible(false);

      if (selectedLevel && levelIndices.length) {
        idx = getNextIndex();
        lastIdxByLevel[selectedLevel] = idx;
      } else {
        idx += 1;
      }
      renderQuestion();

      saveState(getDataFile());
    }

    function restart() {
      const dataFile = getDataFile();
      clearState(dataFile);
      idx = 0;
      selectedLevel = null;
      levelIndices = [];
      lastIdxByLevel = { 1: null, 2: null, 3: null };
      setScoresVisible(false);
      playerScores[0] = 0;
      playerScores[1] = 0;
      playerScores[2] = 0;
      playerScores[3] = 0;
      renderScorePills();
      activePlayer = 0;
      renderLevelRow();
      renderQuestion();
      setTop();

      saveState(dataFile);
    }

    function moveFocus(dir) {
      if (revealed) return;
      if (stage !== "choices") return;

      if (focused < 0) {
        focused = 0;
        applyFocus();
        return;
      }

      const row = Math.floor(focused / 2);
      const col = focused % 2;

      if (dir === "left") focused = row * 2 + Math.max(0, col - 1);
      if (dir === "right") focused = row * 2 + Math.min(1, col + 1);
      if (dir === "up") focused = Math.max(0, focused - 2);
      if (dir === "down") focused = Math.min(3, focused + 2);

      applyFocus();
    }

    document.addEventListener("keydown", (e) => {
      if (els.overlay.classList.contains("show")) {
        if (e.key === "Enter" || e.key === "Escape") hideOverlay();
        return;
      }

      if (e.key === "ArrowLeft") { e.preventDefault(); moveFocus("left"); }
      if (e.key === "ArrowRight") { e.preventDefault(); moveFocus("right"); }
      if (e.key === "ArrowUp") { e.preventDefault(); moveFocus("up"); }
      if (e.key === "ArrowDown") { e.preventDefault(); moveFocus("down"); }

      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        chooseFocused();
      }

      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        showAnswer();
      }

      if (e.key === "n" || e.key === "N") {
        if (!els.btnNext.disabled) nextQuestion();
      }

      if (e.key === "r" || e.key === "R") {
        const ok = window.confirm("Reset the game? This will clear scores and restart from the beginning.");
        if (ok) restart();
      }
    });

    els.btnNext.addEventListener("click", nextQuestion);
    els.btnRestart.addEventListener("click", () => {
      const ok = window.confirm("Reset the game? This will clear scores and restart from the beginning.");
      if (ok) restart();
    });
    els.btnShowChoices.addEventListener("click", showChoices);
    els.btnShowAnswer.addEventListener("click", showAnswer);

    initVoiceControl();
    els.btnVoice?.addEventListener("click", toggleVoice);

    els.btnScores?.addEventListener("click", () => {
      const isHidden = els.scorePills?.classList.contains("hidden");
      setScoresVisible(Boolean(isHidden));
      renderScorePills();
    });

    els.scorePills?.addEventListener("click", () => {
      setScoresVisible(false);
    });

    els.pillPos?.addEventListener("click", () => {
      const ok = window.confirm("End the game now and show the winner?");
      if (ok) endGameNow();
    });

    els.pillPos?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const ok = window.confirm("End the game now and show the winner?");
        if (ok) endGameNow();
      }
    });

    els.btnStart?.addEventListener("click", showSplashRules);
    els.btnStartGame?.addEventListener("click", startGame);
    document.addEventListener("keydown", (e) => {
      if (!els.splash || els.splash.classList.contains("splashHidden")) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const showingRules = els.splashRules && !els.splashRules.classList.contains("splashRulesHidden");
        if (showingRules) startGame();
        else showSplashRules();
      }
    });

    async function loadQuiz() {
      const dataFile = getDataFile();
      try {
        const embedded = getEmbeddedQuizJson();
        let json;
        if (embedded) {
          json = embedded;
        } else {
          // const res = await fetch(dataFile, { cache: "no-store" });
          // if (!res.ok) throw new Error(`HTTP ${res.status}`);
          // json = await res.json();
          throw new Error("Embedded quiz JSON not found. External JSON loading is currently disabled.");
        }

        QUIZ = json;
        applyQuizMeta(json, dataFile);

        // Always rebuild QUESTIONS from the *current* quiz JSON so edits (like level changes)
        // reflect immediately even if localStorage has older saved state.
        QUESTIONS = normalizeQuestions(json?.questions);

        const st = loadState(dataFile);
        if (st) {
          idx = Math.max(0, Math.min(st.idx, QUESTIONS.length - 1));
          selectedLevel = (typeof st.selectedLevel === "number") ? st.selectedLevel : null;
          if (st.lastIdxByLevel && typeof st.lastIdxByLevel === "object") {
            [1, 2, 3].forEach((lvl) => {
              const v = st.lastIdxByLevel[lvl];
              lastIdxByLevel[lvl] = (typeof v === "number") ? Math.max(0, Math.min(v, QUESTIONS.length - 1)) : null;
            });
          }
          activePlayer = (typeof st.activePlayer === "number") ? Math.max(0, Math.min(3, st.activePlayer)) : 0;
          playerScores[0] = st.playerScores[0] ?? 0;
          playerScores[1] = st.playerScores[1] ?? 0;
          playerScores[2] = st.playerScores[2] ?? 0;
          playerScores[3] = st.playerScores[3] ?? 0;
          if (Array.isArray(st.playerPicks) && st.playerPicks.length === 4) {
            playerPicks = st.playerPicks.map(v => (typeof v === "number" ? v : null));
          }
          stage = (st.stage === "choices" || st.stage === "revealed" || st.stage === "question") ? st.stage : "question";
        }

        if (!QUESTIONS.length) {
          showOverlay("No questions", "The JSON file loaded but contains no valid questions. Expected: { questions: [ { question, options[4], answer_index } ] }.");
          els.questionText.textContent = "No questions found.";
          return;
        }

        if (selectedLevel && (selectedLevel < 1 || selectedLevel > 3)) selectedLevel = null;
        rebuildLevelIndices();
        if (selectedLevel) {
          if (!levelIndices.length) {
            selectedLevel = null;
            rebuildLevelIndices();
          } else if (!levelIndices.includes(idx)) {
            idx = levelIndices[0];
          }
        }

        renderLevelRow();

        // Render
        setScoresVisible(false);
        setEndedUi(false);
        renderScorePills();
        renderQuestion();
        if (els.gameRoot && !els.gameRoot.classList.contains("show")) {
          if (els.btnStart) els.btnStart.focus();
        }
        // Restore stage visibility if we have saved state
        if (st) {
          if (stage === "choices" || stage === "revealed") {
            els.answers.classList.remove("concealed");
            els.players.classList.remove("concealed");
            els.btnShowChoices.disabled = true;
            els.btnShowAnswer.disabled = stage !== "choices";
            renderPlayers();
          }
        }
        if (stage === "revealed") {
          // Re-apply reveal highlight without re-scoring
          revealed = true;
          scoredThisQuestion = true;
          const q = QUESTIONS[idx];
          const cards = Array.from(els.answers.querySelectorAll(".ans"));
          cards.forEach((c) => c.classList.remove("ansWrong", "ansCorrect"));
          cards[q.answer_index]?.classList.add("ansCorrect");
          cards.forEach((c) => c.setAttribute("aria-disabled", "true"));
          els.btnNext.disabled = false;
        }
        setTop();
        saveState(dataFile);
      } catch (err) {
        if (els.quizTitle) els.quizTitle.textContent = dataFile;
        els.questionText.textContent = "Could not load quiz data.";
        showOverlay(
          "Cannot load JSON",
          `Could not load ${dataFile}. If you opened this file directly, your browser may block JSON loading. Run a local server (e.g. python3 -m http.server 8000).\n\nError: ${String(err)}`
        );
      }
    }

    loadQuiz();
