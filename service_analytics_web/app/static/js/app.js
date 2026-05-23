/** Общие утилиты веб-интерфейса */

function showToast(message, isError = false) {
  const el = document.getElementById("global-toast");
  if (!el) return;
  el.textContent = message;
  el.classList.remove("hidden", "is-error");
  if (isError) el.classList.add("is-error");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => el.classList.add("hidden"), 4500);
}

async function apiJson(url, options = {}) {
  const res = await fetch(url, {
    headers: { Accept: "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch (_) {
      /* ignore */
    }
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  if (res.status === 204) return null;
  return res.json();
}

function statusPill(status) {
  const cls = ["completed", "successful"].includes(status)
    ? "status-pill--completed"
    : ["new", "pending"].includes(status)
      ? "status-pill--new"
      : "";
  return `<span class="status-pill ${cls}">${escapeHtml(status)}</span>`;
}

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

function chartDefaults() {
  Chart.defaults.color = "#94a3b8";
  Chart.defaults.borderColor = "rgba(148, 163, 184, 0.12)";
  Chart.defaults.font.family = "'DM Sans', system-ui, sans-serif";
}

/** Подсказки при наведении на столбцы (как на дашборде). */
function chartTooltipOptions(valueLabel = "Заявки", { horizontal = false } = {}) {
  return {
    plugins: {
      tooltip: {
        backgroundColor: "#111827",
        titleColor: "#f8fafc",
        bodyColor: "#e2e8f0",
        borderColor: "rgba(148, 163, 184, 0.35)",
        borderWidth: 1,
        cornerRadius: 10,
        padding: 12,
        titleFont: { weight: "700", size: 13 },
        bodyFont: { size: 12 },
        displayColors: true,
        boxPadding: 6,
        callbacks: {
          label(ctx) {
            const v = horizontal ? ctx.parsed.x : ctx.parsed.y;
            return `${valueLabel}: ${v}`;
          },
        },
      },
    },
    interaction: { mode: "nearest", intersect: true },
    hover: {
      mode: "nearest",
      intersect: true,
    },
  };
}

function mergeChartOptions(base, extra) {
  return {
    ...base,
    plugins: { ...base.plugins, ...extra.plugins },
    interaction: { ...base.interaction, ...extra.interaction },
    hover: { ...base.hover, ...extra.hover },
    scales: { ...base.scales, ...extra.scales },
  };
}
