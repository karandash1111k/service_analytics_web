document.addEventListener("DOMContentLoaded", async () => {
  chartDefaults();
  try {
    const [summary, charts] = await Promise.all([
      apiJson("/api/analytics/summary"),
      apiJson("/api/analytics/charts"),
    ]);
    const sla = summary.sla || {};
    const rep = summary.repairs || {};
    document.getElementById("analytics-summary").textContent =
      `SLA: выполнено ${(sla.sla_met_pct || 0).toFixed(1)}% · Просрочки ${(sla.sla_breach_pct || 0).toFixed(1)}% · ` +
      `Ремонты: успех ${(rep.success_pct || 0).toFixed(1)}% · Средняя стоимость ${(rep.avg_cost || 0).toFixed(2)} · ` +
      `Средняя длительность ${(rep.avg_duration_hours || 0).toFixed(2)} ч`;

    const outcomes = charts.outcomes || [];
    new Chart(document.getElementById("chart-outcomes"), {
      type: "doughnut",
      data: {
        labels: outcomes.map((o) => o.status),
        datasets: [{
          data: outcomes.map((o) => o.count),
          backgroundColor: [
            "rgba(56, 189, 248, 0.85)",
            "rgba(52, 211, 153, 0.85)",
            "rgba(251, 113, 133, 0.85)",
            "rgba(167, 139, 250, 0.85)",
            "rgba(251, 191, 36, 0.85)",
          ],
          borderWidth: 0,
        }],
      },
      options: { responsive: true, plugins: { legend: { position: "bottom" } } },
    });

    const dur = charts.duration_hours || [];
    const bins = bucketize(dur, 8);
    new Chart(document.getElementById("chart-duration"), {
      type: "bar",
      data: {
        labels: bins.labels,
        datasets: [{
          label: "Кол-во",
          data: bins.counts,
          backgroundColor: "rgba(52, 211, 153, 0.75)",
          borderRadius: 6,
        }],
      },
      options: mergeChartOptions(
        {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } },
        },
        chartTooltipOptions("Количество")
      ),
    });

    const slaPri = charts.sla_by_priority || [];
    new Chart(document.getElementById("chart-sla-priority"), {
      type: "bar",
      data: {
        labels: slaPri.map((r) => r.priority),
        datasets: [{
          label: "% просрочек",
          data: slaPri.map((r) => r.breach_pct),
          backgroundColor: "rgba(251, 113, 133, 0.8)",
          borderRadius: 6,
        }],
      },
      options: mergeChartOptions(
        {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, max: 100 } },
        },
        chartTooltipOptions("% просрочек")
      ),
    });
  } catch (e) {
    document.getElementById("analytics-summary").textContent = `Ошибка: ${e.message}`;
    showToast(e.message, true);
  }
});

function bucketize(values, n) {
  if (!values.length) return { labels: ["—"], counts: [0] };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const step = (max - min) / n || 1;
  const counts = Array(n).fill(0);
  values.forEach((v) => {
    let idx = Math.min(n - 1, Math.floor((v - min) / step));
    if (idx < 0) idx = 0;
    counts[idx]++;
  });
  const labels = counts.map((_, i) => {
    const a = (min + i * step).toFixed(1);
    const b = (min + (i + 1) * step).toFixed(1);
    return `${a}–${b} ч`;
  });
  return { labels, counts };
}
