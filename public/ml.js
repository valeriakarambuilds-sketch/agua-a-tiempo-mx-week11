"use strict";

(() => {
  const panel = document.createElement("section");
  panel.className = "card sensing-section";
  panel.innerHTML = `
    <p class="eyebrow">03 / MACHINE LEARNING</p>
    <h2>Una segunda revisión, con límites claros.</h2>
    <p>
      Modelo de regresión logística entrenado en este navegador con
      ejemplos sintéticos de avisos. Señala posibles problemas de
      información; no verifica fuentes ni predice cortes.
    </p>
    <button id="ml-analyze" class="secondary" type="button">
      Analizar el formulario con ML
    </button>
    <p id="ml-result" class="notice" aria-live="polite">
      Completa o carga el formulario y solicita el análisis.
    </p>
    <details>
      <summary>Ver evaluación y límites del modelo</summary>
      <p id="ml-evaluation" class="muted"></p>
      <p class="muted">
        Las etiquetas fueron generadas con reglas de diseño y algo de
        variación sintética. El modelo aprende esos ejemplos: no está
        validado con incidentes reales. Sus puntuaciones no son
        probabilidades calibradas de que exista un problema real.
        Las validaciones obligatorias del formulario siguen vigentes.
      </p>
    </details>
  `;
  document.querySelector("main > footer").before(panel);

  try {
    let seed = 11021;
    function random() {
      seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
      return seed / 4294967296;
    }

    // Features: missing source, missing owner, normalized source age,
    // missing/overdue next update, short description, short lead time.
    const examples = Array.from({ length: 600 }, () => {
      const missingSource = random() < 0.15 ? 1 : 0;
      const missingOwner = random() < 0.15 ? 1 : 0;
      const age = random() * 24;
      const badUpdate = random() < 0.2 ? 1 : 0;
      const shortText = random() < 0.2 ? 1 : 0;
      const shortLead = random() < 0.25 ? 1 : 0;
      const x = [
        missingSource, missingOwner, age / 24,
        badUpdate, shortText, shortLead
      ];
      let y = (
        missingSource || missingOwner || age > 12 ||
        badUpdate || shortText || shortLead
      ) ? 1 : 0;
      // Synthetic ambiguity; not observed human judgments.
      if (random() < 0.04) y = 1 - y;
      return { x, y };
    });

    // Fixed-seed shuffle before train/test separation.
    for (let i = examples.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [examples[i], examples[j]] = [examples[j], examples[i]];
    }
    const train = examples.slice(0, 480);
    const test = examples.slice(480);
    const weights = Array(7).fill(0);
    const sigmoid = value =>
      1 / (1 + Math.exp(-Math.max(-30, Math.min(30, value))));
    const predict = x => sigmoid(
      weights[0] + x.reduce((sum, value, i) =>
        sum + value * weights[i + 1], 0)
    );

    // Learn coefficients using training data only.
    for (let epoch = 0; epoch < 1400; epoch++) {
      const gradient = Array(7).fill(0);
      for (const row of train) {
        const error = predict(row.x) - row.y;
        gradient[0] += error;
        row.x.forEach((value, i) => {
          gradient[i + 1] += error * value;
        });
      }
      weights.forEach((value, i) => {
        const penalty = i === 0 ? 0 : 0.001 * value;
        weights[i] -= 0.25 * (gradient[i] / train.length + penalty);
      });
    }

    if (!weights.every(Number.isFinite)) {
      throw new Error("Invalid learned coefficients");
    }

    const counts = { tp: 0, tn: 0, fp: 0, fn: 0 };
    test.forEach(row => {
      const prediction = predict(row.x) >= 0.5 ? 1 : 0;
      if (prediction && row.y) counts.tp++;
      else if (prediction && !row.y) counts.fp++;
      else if (!prediction && row.y) counts.fn++;
      else counts.tn++;
    });

    const percent = (n, d) =>
      d ? `${(100 * n / d).toFixed(1)}%` : "No calculable";

    document.getElementById("ml-evaluation").textContent =
      `480 ejemplos de entrenamiento; 120 de evaluación separados. ` +
      `Clase positiva: aviso que requiere atención. ` +
      `Precisión: ${percent(counts.tp, counts.tp + counts.fp)}. ` +
      `Recall: ${percent(counts.tp, counts.tp + counts.fn)}. ` +
      `Verdaderos positivos: ${counts.tp}; verdaderos negativos: ${counts.tn}; ` +
      `falsos positivos: ${counts.fp}; falsos negativos: ${counts.fn}. ` +
      `Resultados sobre datos sintéticos, no sobre el servicio real.`;

    function analyze() {
      const get = id => document.getElementById(id);
      const now = Date.now();
      const sourceDate = new Date(get("source-time").value).getTime();
      const updateDate = new Date(get("next-update").value).getTime();
      const startDate = new Date(get("start-time").value).getTime();
      const age = Number.isFinite(sourceDate)
        ? Math.max(0, Math.min(24, (now - sourceDate) / 3600000))
        : 24;
      const scheduled = get("event-type").value === "scheduled";
      const shortLead = scheduled &&
        (!Number.isFinite(startDate) || startDate - now < 12 * 3600000);

      const x = [
        get("source").value.trim().length < 5 ? 1 : 0,
        get("owner").value.trim().length < 5 ? 1 : 0,
        age / 24,
        !Number.isFinite(updateDate) || updateDate <= now ? 1 : 0,
        get("note").value.trim().length < 10 ? 1 : 0,
        shortLead ? 1 : 0
      ];
      const score = predict(x);
      document.getElementById("ml-result").textContent =
        `${score >= 0.5
          ? "El modelo sugiere revisar posibles problemas de información."
          : "El modelo no señala una alerta adicional en estas variables."} ` +
        `Puntuación interna: ${score.toFixed(2)}; umbral: 0.50. ` +
        `Esto no confirma la fuente, autoriza el aviso ni cambia su estado.`;
    }

    document.getElementById("ml-analyze").addEventListener("click", analyze);

    function invalidateML() {
      document.getElementById("ml-result").textContent =
        "El formulario cambió. Solicita un nuevo análisis ML.";
    }
    document.getElementById("incident-form")
      .addEventListener("input", invalidateML);
    document.getElementById("load-example")
      .addEventListener("click", invalidateML);
  } catch (error) {
    document.getElementById("ml-result").textContent =
      "ML no disponible. No se sustituye por una respuesta inventada.";
    document.getElementById("ml-analyze").disabled = true;
    console.error("ML initialization failed:", error);
  }
})();
