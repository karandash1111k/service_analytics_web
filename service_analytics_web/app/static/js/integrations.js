document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btn-refresh").addEventListener("click", loadLogs);
  document.getElementById("btn-bitrix").addEventListener("click", () => runSync("/api/integrations/bitrix", "Bitrix24"));
  document.getElementById("btn-onec").addEventListener("click", () => runSync("/api/integrations/onec", "1С"));
  document.getElementById("excel-file").addEventListener("change", importExcel);
  loadLogs();
});

async function loadLogs() {
  const logsBody = document.querySelector("#logs-table tbody");
  const syncBody = document.querySelector("#sync-table tbody");
  try {
    const data = await apiJson("/api/integrations/logs");
    const logs = data.logs || [];
    const hist = data.sync_history || [];

    logsBody.innerHTML = logs.length
      ? logs
          .map(
            (l) => `<tr>
            <td>${l.id}</td>
            <td>${escapeHtml(l.source_system)}</td>
            <td>${escapeHtml(l.operation_type)}</td>
            <td>${statusPill(l.status)}</td>
            <td>${escapeHtml(l.message)}</td>
          </tr>`
          )
          .join("")
      : '<tr class="empty-row"><td colspan="5">Пусто</td></tr>';

    syncBody.innerHTML = hist.length
      ? hist
          .map(
            (h) => `<tr>
            <td>${h.id}</td>
            <td>${escapeHtml(h.source_system)}</td>
            <td>${h.records_processed}</td>
            <td>${escapeHtml(h.started_at)}</td>
            <td>${escapeHtml(h.finished_at)}</td>
            <td>${statusPill(h.sync_status)}</td>
          </tr>`
          )
          .join("")
      : '<tr class="empty-row"><td colspan="6">Пусто</td></tr>';
  } catch (e) {
    showToast(e.message, true);
  }
}

async function runSync(url, label) {
  try {
    const res = await apiJson(url, { method: "POST" });
    showToast(`${label}: загружено ${res.loaded ?? "—"}`);
    loadLogs();
  } catch (e) {
    showToast(e.message, true);
    loadLogs();
  }
}

async function importExcel(ev) {
  const file = ev.target.files?.[0];
  if (!file) return;
  const fd = new FormData();
  fd.append("file", file);
  try {
    const res = await fetch("/api/integrations/excel", { method: "POST", body: fd });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail || res.statusText);
    }
    const data = await res.json();
    showToast(`Excel: импортировано ${data.loaded} строк`);
    loadLogs();
  } catch (e) {
    showToast(e.message, true);
  }
  ev.target.value = "";
}
