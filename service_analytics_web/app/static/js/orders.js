let selectedOrderId = null;

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btn-refresh").addEventListener("click", loadOrders);
  document.getElementById("filter-status").addEventListener("change", loadOrders);
  document.getElementById("filter-search").addEventListener("keydown", (e) => {
    if (e.key === "Enter") loadOrders();
  });
  document.getElementById("btn-assign").addEventListener("click", assignOrder);
  document.getElementById("btn-complete").addEventListener("click", completeOrder);
  loadEngineers();
  loadOrders();
});

async function loadEngineers() {
  try {
    const list = await apiJson("/api/engineers");
    const sel = document.getElementById("engineer-select");
    sel.innerHTML = list.map((e) => `<option value="${e.id}">${escapeHtml(e.full_name)}</option>`).join("");
  } catch (e) {
    showToast(e.message, true);
  }
}

async function loadOrders() {
  const status = document.getElementById("filter-status").value;
  const search = document.getElementById("filter-search").value.trim();
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (search) params.set("search", search);
  const tbody = document.querySelector("#orders-table tbody");
  try {
    const rows = await apiJson(`/api/orders?${params}`);
    selectedOrderId = null;
    if (!rows.length) {
      tbody.innerHTML = '<tr class="empty-row"><td colspan="8">Нет заявок</td></tr>';
      return;
    }
    tbody.innerHTML = rows
      .map(
        (o) => `<tr data-id="${o.id}">
          <td>${o.id}</td>
          <td>${escapeHtml(o.client)}</td>
          <td>${escapeHtml(o.engineer)}</td>
          <td>${escapeHtml(o.title)}</td>
          <td>${statusPill(o.status)}</td>
          <td>${escapeHtml(o.priority)}</td>
          <td>${escapeHtml(o.created_at)}</td>
          <td>${escapeHtml(o.completed_at)}</td>
        </tr>`
      )
      .join("");
    tbody.querySelectorAll("tr[data-id]").forEach((tr) => {
      tr.addEventListener("click", () => {
        tbody.querySelectorAll("tr").forEach((r) => r.classList.remove("is-selected"));
        tr.classList.add("is-selected");
        selectedOrderId = Number(tr.dataset.id);
      });
    });
  } catch (e) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="8">${escapeHtml(e.message)}</td></tr>`;
    showToast(e.message, true);
  }
}

async function assignOrder() {
  if (!selectedOrderId) {
    showToast("Выберите заявку в таблице", true);
    return;
  }
  const engineerId = Number(document.getElementById("engineer-select").value);
  try {
    await apiJson(`/api/orders/${selectedOrderId}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ engineer_id: engineerId }),
    });
    showToast("Инженер назначен");
    loadOrders();
  } catch (e) {
    showToast(e.message, true);
  }
}

async function completeOrder() {
  if (!selectedOrderId) {
    showToast("Выберите заявку в таблице", true);
    return;
  }
  try {
    await apiJson(`/api/orders/${selectedOrderId}/complete`, { method: "POST" });
    showToast("Заявка завершена");
    loadOrders();
  } catch (e) {
    showToast(e.message, true);
  }
}
