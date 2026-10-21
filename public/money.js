"use strict";

(() => {
  const panel = document.createElement("section");
  panel.className = "card sensing-section";
  panel.innerHTML = `
    <p class="eyebrow">04 / MONEY · PILOTO PROPUESTO</p>
    <h2>¿Cuánto cuesta y qué evidencia falta?</h2>
    <p>
      Diseño para 100 hogares durante 3 meses. Presupuesto máximo:
      <strong>$15,000 MXN</strong>. Financiamiento propuesto por el
      prestador del servicio; no existe un comprador validado.
    </p>

    <div class="sensor-grid">
      <article class="sensor-tile">
        <h3>Componente fijo · 70%</h3>
        <p class="reserve-value">$10,500</p>
        <p class="muted">Propuesto; no significa pagado.</p>
      </article>
      <article class="sensor-tile">
        <h3>Calidad · hasta 30%</h3>
        <p class="reserve-value">$4,500</p>
        <p class="muted">Sujeto a evidencia y revisión humana.</p>
      </article>
      <article class="sensor-tile">
        <h3>Costo para residentes</h3>
        <p class="reserve-value">$0</p>
        <p class="muted">Sin membresía ni app obligatoria.</p>
      </article>
    </div>

    <form id="money-form" novalidate>
      <h3>Simular costos completos del piloto</h3>
      <p class="muted">
        Ingresa montos ficticios en MXN. Incluye el valor estimado del
        tiempo donado y aportaciones en especie para no ocultar costos.
        No sumes dos veces el mismo recurso.
      </p>
      <div id="cost-fields" class="sensor-grid"></div>

      <h3>Simular evidencia de calidad</h3>
      <p class="muted">
        Captura conteos ficticios. Un denominador de cero significa
        inconcluso. Las fallas inesperadas no entran en cortes programados.
      </p>
      <div id="quality-fields"></div>

      <label for="money-exclusions">
        Hogares excluidos del alcance observado · conteo ficticio
      </label>
      <input id="money-exclusions" type="number"
        min="0" max="100" step="1" value="0">

      <label for="money-false-alerts">Falsas alertas · conteo ficticio</label>
      <input id="money-false-alerts" type="number"
        min="0" max="10000" step="1" value="0">

      <button type="submit" class="primary">
        Calcular escenario ficticio
      </button>
    </form>

    <div id="money-result" class="notice" aria-live="polite">
      Sin cálculo. Los escenarios no acreditan resultados reales.
    </div>

    <p class="muted">
      Regla propuesta para esta demo: los tres objetivos deben cumplirse
      para ilustrar elegibilidad del componente de calidad. El Blueprint
      define el reparto 70/30, pero no esta fórmula de elegibilidad.
      No hay desembolsos automáticos.
    </p>
    <p>
      <strong>Resultado real del piloto: inconcluso.</strong>
      No hay eventos reales evaluados. Pago por calidad:
      no acreditado. Beneficio financiero 10:1: no demostrado.
    </p>
    <p class="muted">
      Antes de gastar en campo, un contacto del servicio debe aceptar
      verificación de fuentes, correcciones y escalamiento.
    </p>
  `;
  document.querySelector("main > footer").before(panel);

  const costs = [
    ["labor", "Trabajo operativo"],
    ["setup", "Configuración"],
    ["sms", "Mensajería"],
    ["offline", "Acceso fuera de la app"],
    ["inkind", "Tiempo donado / aportaciones"],
    ["other", "Otros costos"]
  ];
  const metrics = [
    ["notice", "Avisos programados con al menos 12 h", "Avisos programados elegibles", 0.90],
    ["understand", "Personas que comprendieron", "Personas muestreadas", 0.80],
    ["prepare", "Hogares que se prepararon", "Hogares con posibilidad de prepararse", 0.70]
  ];

  const costContainer = document.getElementById("cost-fields");
  for (const [id, label] of costs) {
    const field = document.createElement("div");
    field.innerHTML = `
      <label for="cost-${id}">${label}</label>
      <input id="cost-${id}" type="number" min="0"
        max="1000000" step="0.01" value="0" required>
    `;
    costContainer.append(field);
  }

  const qualityContainer = document.getElementById("quality-fields");
  for (const [id, numerator, denominator] of metrics) {
    const row = document.createElement("div");
    row.className = "form-row";
    row.innerHTML = `
      <div>
        <label for="${id}-n">${numerator}</label>
        <input id="${id}-n" type="number" min="0"
          max="10000" step="1" value="0" required>
      </div>
      <div>
        <label for="${id}-d">${denominator}</label>
        <input id="${id}-d" type="number" min="0"
          max="10000" step="1" value="0" required>
      </div>
    `;
    qualityContainer.append(row);
  }

  const form = document.getElementById("money-form");
  const output = document.getElementById("money-result");
  const currency = value => new Intl.NumberFormat("es-MX", {
    style: "currency", currency: "MXN"
  }).format(value);

  form.addEventListener("input", () => {
    output.textContent = "Los datos cambiaron. Calcula nuevamente el escenario.";
  });

  form.addEventListener("submit", event => {
    event.preventDefault();
    const errors = [];
    function read(id, integer = false, max = 1000000) {
      const input = document.getElementById(id);
      const raw = input.value.trim();
      const value = Number(raw);
      if (!raw || !Number.isFinite(value) || value < 0 || value > max ||
          (integer && !Number.isInteger(value)) || !input.validity.valid) {
        errors.push(`Revisa el campo: ${input.labels[0].textContent.trim()}.`);
      }
      return value;
    }

    const total = costs.reduce((sum, [id]) => sum + read(`cost-${id}`), 0);
    const evaluated = metrics.map(([id, title, denominator, target]) => {
      const n = read(`${id}-n`, true, 10000);
      const d = read(`${id}-d`, true, 10000);
      if (n > d) errors.push(`${title}: el numerador no puede superar al denominador.`);
      if (id === "prepare" && d > 100) {
        errors.push("Los hogares con posibilidad de prepararse no pueden superar 100.");
      }
      return { title, n, d, target, rate: d > 0 ? n / d : null };
    });
    const exclusions = read("money-exclusions", true, 100);
    const falseAlerts = read("money-false-alerts", true, 10000);

    if (errors.length) {
      output.textContent = errors.join("\n");
      output.style.whiteSpace = "pre-line";
      return;
    }

    const lines = [
      "ESCENARIO FICTICIO · No acredita resultados reales",
      `Costo completo ingresado: ${currency(total)}.`,
      total > 15000
        ? `Exceso sobre el presupuesto: ${currency(total - 15000)}.`
        : `Presupuesto restante: ${currency(15000 - total)}.`,
      `Asignación presupuestal: $150 por hogar por piloto; $50 por hogar-mes. No es un precio al residente.`,
      `Beneficio atribuible requerido para 10:1: ${currency(total * 10)}. No demostrado.`
    ];

    for (const metric of evaluated) {
      const rate = metric.rate === null
        ? "Inconcluso"
        : `${(metric.rate * 100).toFixed(1)}%`;
      const outcome = metric.rate === null ? "sin denominador"
        : metric.rate >= metric.target ? "cumple en este escenario" : "no cumple";
      lines.push(
        `${metric.title}: ${metric.n}/${metric.d} · ${rate} · ` +
        `objetivo ${metric.target * 100}% · ${outcome}.`
      );
    }

    const inconclusive = evaluated.some(item => item.rate === null);
    const passes = evaluated.every(item =>
      item.rate !== null && item.rate >= item.target
    );
    lines.push(`Hogares excluidos: ${exclusions}; falsas alertas: ${falseAlerts}.`);
    lines.push(inconclusive
      ? "Calidad del escenario: inconclusa."
      : passes
        ? "El escenario cumple los tres umbrales; ilustra hasta $4,500 sujetos a revisión."
        : "El escenario no cumple los tres umbrales.");
    lines.push(
      "Elegibilidad real y pago: no acreditados. No existen eventos reales evaluados."
    );
    output.textContent = lines.join("\n\n");
    output.style.whiteSpace = "pre-line";
  });
})();
