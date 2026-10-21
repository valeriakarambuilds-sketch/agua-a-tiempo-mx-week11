"use strict";

(() => {
  const section = document.createElement("section");
  section.className = "card sensing-section";
  section.innerHTML = `
    <p class="eyebrow">02 / SENSING + GEODATOS</p>
    <h2>Una lectura orienta. No confirma un corte.</h2>
    <p class="muted">
      Feed simulado de reservas. No hay sensores físicos conectados.
      Las zonas y coordenadas son inventadas.
    </p>

    <div class="sensor-grid">
      <article class="sensor-tile">
        <h3>Zona A · ficticia</h3>
        <p class="reserve-value">42%</p>
        <p>Reserva simulada</p>
        <p id="fresh-reading" class="muted"></p>
      </article>
      <article class="sensor-tile">
        <h3>Zona B · ficticia</h3>
        <p class="reserve-value">18%</p>
        <p>Estimación manual simulada</p>
        <p id="stale-reading" class="muted"></p>
        <span class="badge">Lectura antigua</span>
      </article>
      <article class="sensor-tile">
        <h3>Zona C · ficticia</h3>
        <p class="reserve-value">Sin dato</p>
        <p>No se recibió una lectura</p>
        <span class="badge">Conserva acceso a avisos</span>
      </article>
    </div>

    <div class="geo-workspace">
      <div>
        <h3>Esquema de zonas ficticias</h3>
        <svg viewBox="0 0 340 150" role="img"
          aria-label="Tres zonas ficticias. A y B arriba, C abajo de A.">
          <path d="M10 10H160V70H10Z" fill="#b9e4df" stroke="#087f82"/>
          <path d="M170 10H320V70H170Z" fill="#d5e5f0" stroke="#52798f"/>
          <path d="M10 80H160V140H10Z" fill="#e7e7d3" stroke="#85855f"/>
          <text x="85" y="47" text-anchor="middle">Zona A</text>
          <text x="245" y="47" text-anchor="middle">Zona B</text>
          <text x="85" y="117" text-anchor="middle">Zona C</text>
        </svg>
        <p class="muted">
          Esquema sin ubicación real. No muestra domicilios ni solicita GPS.
        </p>
      </div>
      <div>
        <label for="geo-point">Probar coincidencia geográfica</label>
        <select id="geo-point">
          <option value="A">Punto ficticio dentro de A</option>
          <option value="B">Punto ficticio dentro de B</option>
          <option value="C">Punto ficticio dentro de C</option>
          <option value="outside">Punto fuera de cobertura</option>
        </select>
        <p id="geo-result" class="notice" aria-live="polite"></p>
        <p class="muted">
          La coincidencia asigna una zona; no verifica un incidente.
        </p>
      </div>
    </div>
  `;

  document.querySelector("main > footer").before(section);

  const loadedAt = Date.now();
  const format = date => new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium", timeStyle: "short"
  }).format(date);

  function updateReadingLabels() {
    const freshAt = loadedAt - 30 * 60000;
    const staleAt = loadedAt - 18 * 3600000;
    const isOld = Date.now() - freshAt > 12 * 3600000;
    document.getElementById("fresh-reading").textContent =
      `${format(new Date(freshAt))} · ${isOld ? "Lectura antigua" : "Reciente al cargar"} · Simulada`;
    document.getElementById("stale-reading").textContent =
      `${format(new Date(staleAt))} · Más de 12 h · Simulada`;
  }

  updateReadingLabels();
  setInterval(updateReadingLabels, 60000);

  const zones = {
    type: "FeatureCollection",
    features: [
      { type: "Feature", properties: { zone: "A" },
        geometry: { type: "Polygon", coordinates: [
          [[0,0],[1,0],[1,1],[0,1],[0,0]]
        ] } },
      { type: "Feature", properties: { zone: "B" },
        geometry: { type: "Polygon", coordinates: [
          [[1.1,0],[2.1,0],[2.1,1],[1.1,1],[1.1,0]]
        ] } },
      { type: "Feature", properties: { zone: "C" },
        geometry: { type: "Polygon", coordinates: [
          [[0,-1.1],[1,-1.1],[1,-0.1],[0,-0.1],[0,-1.1]]
        ] } }
    ]
  };

  function inside(point, ring) {
    const [x, y] = point;
    let result = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if ((yi > y) !== (yj > y) &&
          x < (xj - xi) * (y - yi) / (yj - yi) + xi) {
        result = !result;
      }
    }
    return result;
  }

  const points = {
    A: [0.5, 0.5],
    B: [1.6, 0.5],
    C: [0.5, -0.6],
    outside: [3, 3]
  };

  function updateGeo() {
    const point = points[document.getElementById("geo-point").value];
    const match = point && zones.features.find(feature =>
      inside(point, feature.geometry.coordinates[0])
    );
    document.getElementById("geo-result").textContent = match
      ? `Coordenada ficticia [${point.join(", ")}]: coincide con Zona ${match.properties.zone}.`
      : "Fuera de cobertura: no se asignó ninguna zona. Esto no implica negar avisos básicos.";
  }

  document.getElementById("geo-point").addEventListener("change", updateGeo);
  updateGeo();
})();
