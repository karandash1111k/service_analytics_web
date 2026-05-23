document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btn-refresh").addEventListener("click", loadRepairs);
  document.getElementById("filter-status").addEventListener("change", loadRepairs);
  loadRepairs();
});

async function loadRepairs() {
  const status = document.getElementById("filter-status").value;
  const params = status ? `?status=${encodeURIComponent(status)}` : "";
  const tbody = document.querySelector("#repairs-table tbody");
  try {
    const rows = await apiJson(`/api/repairs${params}`);
    if (!rows.length) {
      tbody.innerHTML = '<tr class="empty-row"><td colspan="9">Нет ремонтов</td></tr>';
      return;
    }
    tbody.innerHTML = rows
      .map(
        (r) => `<tr>
          <td>${r.id}</td>
          <td>${r.order_id}</td>
          <td>${escapeHtml(r.device_type)}</td>
          <td>${escapeHtml(r.device_model)}</td>
          <td>${statusPill(r.repair_status)}</td>
          <td>${r.repair_cost.toFixed(2)}</td>
          <td>${escapeHtml(r.started_at)}</td>
          <td>${escapeHtml(r.finished_at)}</td>
          <td>${escapeHtml(r.repair_result)}</td>
        </tr>`
      )
      .join("");
  } catch (e) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="9">${escapeHtml(e.message)}</td></tr>`;
    showToast(e.message, true);
  }
}
