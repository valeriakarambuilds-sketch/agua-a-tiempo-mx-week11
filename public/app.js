"use strict";

const $ = id => document.getElementById(id);
const form = $("incident-form");
const status = $("status");
const result = $("review-result");
const preview = $("sms-preview");

const localValue = date => {
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return adjusted.toISOString().slice(0, 16);
};

const displayDate = date => new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeStyle: "short"
}).format(date);

function updateType() {
  const scheduled = $("event-type").value === "scheduled";
  $("start-time").required = scheduled;
  $("start-time").disabled = !scheduled;
  $("start-label").textContent = scheduled
    ? "Inicio del corte programado"
    : "Inicio programado · No aplica";
  $("start-help").textContent = scheduled
    ? "Se usa para calcular la anticipación del aviso."
    : "Las fallas inesperadas no entran en la métrica de aviso con 12 horas.";
}

function invalidateReview() {
  status.textContent = "Pendiente de revisión";
  result.replaceChildren();
  const message = document.createElement("p");
  message.className = "muted";
  message.textContent = "La información cambió. La coordinación debe revisarla nuevamente. Las personas residentes no tienen que aprobarla.";
  result.append(message);
  preview.textContent = "Sin muestra lista: falta la revisión de la coordinación. No se ha enviado ningún SMS.";
}

form.addEventListener("input", event => {
  if (event.target.id !== "human-review") {
    $("human-review").checked = false;
  }
  invalidateReview();
});

$("event-type").addEventListener("change", updateType);

$("load-example").addEventListener("click", () => {
  const now = new Date();
  $("zone").value = "A";
  $("event-type").value = "scheduled";
  $("source").value = "Boletín ficticio SIM-014";
  $("owner").value = "Coordinación de turno de demostración";
  $("source-time").value = localValue(new Date(now.getTime() - 60 * 60000));
  $("next-update").value = localValue(new Date(now.getTime() + 3 * 60 * 60000));
  $("start-time").value = localValue(new Date(now.getTime() + 18 * 60 * 60000));
  $("note").value = "Ejemplo ficticio de interrupción programada en la Zona A. Causa no verificada.";
  $("human-review").checked = false;
  updateType();
  invalidateReview();
});

form.addEventListener("submit", event => {
  event.preventDefault();

  const now = new Date();
  const errors = [];
  const zone = $("zone").value;
  const type = $("event-type").value;
  const source = $("source").value.trim();
  const owner = $("owner").value.trim();
  const note = $("note").value.trim();
  const sourceTime = new Date($("source-time").value);
  const nextUpdate = new Date($("next-update").value);
  const startTime = new Date($("start-time").value);
  const validDate = date => Number.isFinite(date.getTime());

  if (!["A", "B", "C"].includes(zone)) {
    errors.push("Selecciona una zona ficticia válida.");
  }
  if (!["scheduled", "unexpected"].includes(type)) {
    errors.push("Selecciona un tipo de incidente válido.");
  }
  if (source.length < 5 || source.length > 120) {
    errors.push("La referencia de la fuente debe tener entre 5 y 120 caracteres.");
  }
  if (owner.length < 5 || owner.length > 80) {
    errors.push("El rol responsable debe tener entre 5 y 80 caracteres.");
  }
  if (note.length < 10 || note.length > 300) {
    errors.push("La descripción debe tener entre 10 y 300 caracteres.");
  }
  if (!validDate(sourceTime)) {
    errors.push("Captura una fecha válida para la fuente.");
  } else {
    if (sourceTime > now) {
      errors.push("La fecha de la fuente no puede estar en el futuro.");
    }
    if (now - sourceTime > 12 * 60 * 60000) {
      errors.push("La fuente tiene más de 12 horas: solicita una actualización.");
    }
  }
  if (!validDate(nextUpdate) || nextUpdate <= now) {
    errors.push("La próxima actualización debe ser una fecha futura.");
  }
  if (validDate(sourceTime) && validDate(nextUpdate) && nextUpdate <= sourceTime) {
    errors.push("La próxima actualización debe ser posterior a la fuente.");
  }
  if (type === "scheduled" && (!validDate(startTime) || startTime <= now)) {
    errors.push("El inicio del corte programado debe ser una fecha futura.");
  }
  if (!$("human-review").checked) {
    errors.push("Falta simular la revisión humana. La demo no acredita autorización real.");
  }

  result.replaceChildren();

  if (errors.length) {
    status.textContent = "Requiere correcciones";
    const list = document.createElement("ul");
    list.className = "error-list";
    errors.forEach(error => {
      const item = document.createElement("li");
      item.textContent = error;
      list.append(item);
    });
    result.append(list);
    preview.textContent = "Vista previa bloqueada. Corrige los puntos señalados y vuelve a revisar.";
    return;
  }

  status.textContent = "Revisión simulada";
  const heading = document.createElement("p");
  heading.className = "success-text";
  heading.textContent = "Datos completos para esta demostración.";
  result.append(heading);

  const timing = document.createElement("p");
  timing.className = "muted";
  if (type === "scheduled") {
    const leadHours = (startTime - now) / 3600000;
    timing.textContent = `Anticipación potencial si se enviara ahora: ${leadHours.toFixed(1)} h. ${
      leadHours >= 12 ? "Alcanza el umbral de 12 h." : "No alcanza el umbral de 12 h."
    } No se ha enviado; no cuenta como aviso entregado.`;
  } else {
    timing.textContent = "Falla inesperada: fuera de la métrica de cortes programados con 12 h de anticipación.";
  }
  result.append(timing);

  const warning = document.createElement("p");
  warning.className = "muted";
  warning.textContent = "La revisión es una simulación. No se verificó la fuente externamente.";
  result.append(warning);

  const eventLine = type === "scheduled"
    ? `Corte programado ficticio: ${displayDate(startTime)}.`
    : "Falla inesperada ficticia.";

  preview.textContent =
    `DEMO · NO ENVIADO\n` +
    `SIM-001 · Zona ${zone} ficticia.\n` +
    `${eventLine}\n` +
    `Fuente ingresada: ${source}.\n` +
    `Responsable ficticio: ${owner}.\n` +
    `Restablecimiento: no confirmado.\n` +
    `Próxima actualización de información: ${displayDate(nextUpdate)}. No es la hora de regreso del agua.\n` +
    `Sin costo para residentes.`;
});

updateType();
