(function () {
  const DATA_FILES = {
    QUIZ_DEC_QA: "data/QUIZ_DEC_QA.js",
    QUIZ_ARAB_NOUN: "data/QUIZ_ARAB_NOUN.js",
    QUIZ_ENG_NOUN: "data/QUIZ_ENG_NOUN.js",
    QUIZ_ENG_VERB: "data/QUIZ_ENG_VERB.js",
    QUIZ_NUMERAL: "data/QUIZ_NUMERAL.js",
    QUIZ_NUMERAL2: "data/QUIZ_NUMERAL2.js",
  };

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Failed to load: " + src));
      document.head.appendChild(s);
    });
  }

  async function boot() {
    // Backward-compatibility: if index.html already set window.QUIZ, just start the quiz engine.
    if (window.QUIZ && Array.isArray(window.QUIZ.questions)) {
      await loadScript("js/quiz.js");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const requested = params.get("quiz") || "QUIZ_ARAB_NOUN";
    window.QUIZ_PARAM = requested;

    const dataSrc = DATA_FILES[requested];
    if (!window[requested] && dataSrc) {
      try {
        await loadScript(dataSrc);
      } catch (e) {
        console.warn(e);
      }
    }

    // Build map from whatever is currently present on window.
    const QUIZ_MAP = {};
    Object.keys(DATA_FILES).forEach((k) => {
      if (window[k] && Array.isArray(window[k].questions)) {
        QUIZ_MAP[k] = window[k];
      }
    });

    // Pick quiz: requested -> fallback to arab noun -> first available.
    window.QUIZ =
      QUIZ_MAP[requested] ||
      QUIZ_MAP.QUIZ_ARAB_NOUN ||
      QUIZ_MAP[Object.keys(QUIZ_MAP)[0]] ||
      null;

    if (!window.QUIZ) return;

    // Load main quiz engine after window.QUIZ is set.
    await loadScript("js/quiz.js");
  }

  boot();
})();
