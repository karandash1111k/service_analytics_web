document.addEventListener("DOMContentLoaded", async () => {
  chartDefaults();
  try {
    const [summary, charts] = await Promise.all([
      apiJson("/api/dashboard/summary"),
      apiJson("/api/dashboard/charts"),
    ]);
    const sla = summary.sla || {};
    const rep = summary.repairs || {};

    document.getElementById("kpi-sla").textContent = `${(sla.sla_met_pct || 0).toFixed(1)}%`;
    document.getElementById("kpi-hours").textContent = `${(sla.avg_resolution_hours || 0).toFixed(1)}`;
    document.getElementById("kpi-forecast").textContent = `${(summary.forecast_next_day_orders || 0).toFixed(2)}`;
    document.getElementById("kpi-success").textContent = `${(rep.success_pct || 0).toFixed(1)}%`;

    document.getElementById("detail-strip").textContent = [
      `Оценено заявок: ${sla.orders_evaluated || 0}`,
      `Просрочки SLA: ${(sla.sla_breach_pct || 0).toFixed(2)}%`,
      `Средняя стоимость ремонта: ${(rep.avg_cost || 0).toFixed(2)}`,
      `Средняя длительность: ${(rep.avg_duration_hours || 0).toFixed(2)} ч`,
    ].join(" · ");

    const orders = charts.orders_per_day || [];
    const load = charts.engineer_load || [];

    new Chart(document.getElementById("chart-orders"), {
      type: "bar",
      data: {
        labels: orders.map((r) => String(r.day).slice(0, 10)),
        datasets: [{
          label: "Заявки",
          data: orders.map((r) => r.count),
          backgroundColor: "rgba(56, 189, 248, 0.75)",
          borderRadius: 6,
        }],
      },
      options: mergeChartOptions(
        {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false } },
            y: { beginAtZero: true },
          },
        },
        chartTooltipOptions("Заявки")
      ),
    });

    new Chart(document.getElementById("chart-engineers"), {
      type: "bar",
      data: {
        labels: load.map((r) => r.engineer),
        datasets: [{
          label: "Заявки",
          data: load.map((r) => r.orders),
          backgroundColor: "rgba(167, 139, 250, 0.8)",
          borderRadius: 6,
        }],
      },
      options: mergeChartOptions(
        {
          indexAxis: "y",
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true },
            y: { grid: { display: false } },
          },
        },
        chartTooltipOptions("Заявки", { horizontal: true })
      ),
    });
  } catch (e) {
    document.getElementById("detail-strip").textContent = `Ошибка: ${e.message}`;
    showToast(e.message, true);
  }
});
