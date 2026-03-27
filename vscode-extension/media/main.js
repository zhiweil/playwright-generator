// @ts-check
(function () {
  const vscode = acquireVsCodeApi();

  // ── Helpers ───────────────────────────────────────────────────────────────
  function el(id) { return document.getElementById(id); }
  function val(id) { return el(id).value; }
  function setVal(id, v) { const e = el(id); if (e) { e.value = v ?? ""; } }
  function setChecked(id, v) { const e = el(id); if (e) { e.checked = v === "true" || v === true; } }

  // ── Tabs ──────────────────────────────────────────────────────────────────
  document.querySelectorAll(".tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      document.querySelectorAll(".tab").forEach(function (t) { t.classList.remove("active"); });
      document.querySelectorAll(".tab-panel").forEach(function (p) { p.classList.add("hidden"); });
      tab.classList.add("active");
      var panelId = "tab-" + tab.getAttribute("data-tab");
      el(panelId).classList.remove("hidden");
    });
  });

  // ── Model field visibility ────────────────────────────────────────────────
  function updateModelFields(model) {
    var all = ["claude-fields", "azure-fields", "chatgpt-fields", "local-fields"];
    var map = {
      "claude": "claude-fields",
      "azure-openai": "azure-fields",
      "chatgpt": "chatgpt-fields",
      "local": "local-fields",
    };
    for (var i = 0; i < all.length; i++) { el(all[i]).classList.add("hidden"); }
    if (map[model]) { el(map[model]).classList.remove("hidden"); }
  }

  el("AI_MODEL").addEventListener("change", function () { updateModelFields(val("AI_MODEL")); scheduleConfigSave(); });

  // ── Config auto-save ─────────────────────────────────────────────────────────
  var configSaveTimer = null;

  function collectEnv() {
    return {
      AI_MODEL: val("AI_MODEL"),
      CLAUDE_API_KEY: val("CLAUDE_API_KEY"),
      AZURE_OPENAI_API_KEY: val("AZURE_OPENAI_API_KEY"),
      AZURE_OPENAI_ENDPOINT: val("AZURE_OPENAI_ENDPOINT"),
      CHATGPT_API_KEY: val("CHATGPT_API_KEY"),
      CHATGPT_MODEL: val("CHATGPT_MODEL"),
      LOCAL_LLM_URL: val("LOCAL_LLM_URL"),
      LOCAL_LLM_MODEL: val("LOCAL_LLM_MODEL"),
      BROWSER: val("BROWSER"),
      HEADLESS: String(el("HEADLESS").checked),
      TIMEOUT: val("TIMEOUT"),
      RETRIES: val("RETRIES"),
      VIDEO: val("VIDEO"),
    };
  }

  function scheduleConfigSave() {
    if (configSaveTimer) { clearTimeout(configSaveTimer); }
    configSaveTimer = setTimeout(function () {
      vscode.postMessage({ command: "saveEnv", env: collectEnv() });
    }, 600);
  }

  var configInputIds = [
    "CLAUDE_API_KEY", "AZURE_OPENAI_API_KEY", "AZURE_OPENAI_ENDPOINT",
    "CHATGPT_API_KEY", "CHATGPT_MODEL", "LOCAL_LLM_URL", "LOCAL_LLM_MODEL",
    "TIMEOUT", "RETRIES"
  ];
  configInputIds.forEach(function (id) {
    el(id).addEventListener("input", scheduleConfigSave);
  });
  ["BROWSER", "VIDEO"].forEach(function (id) {
    el(id).addEventListener("change", scheduleConfigSave);
  });
  el("HEADLESS").addEventListener("change", scheduleConfigSave);

  // ── Populate form from env ────────────────────────────────────────────────
  function applyEnv(env) {
    setVal("AI_MODEL", env.AI_MODEL);
    setVal("CLAUDE_API_KEY", env.CLAUDE_API_KEY);
    setVal("AZURE_OPENAI_API_KEY", env.AZURE_OPENAI_API_KEY);
    setVal("AZURE_OPENAI_ENDPOINT", env.AZURE_OPENAI_ENDPOINT);
    setVal("CHATGPT_API_KEY", env.CHATGPT_API_KEY);
    setVal("CHATGPT_MODEL", env.CHATGPT_MODEL);
    setVal("LOCAL_LLM_URL", env.LOCAL_LLM_URL);
    setVal("LOCAL_LLM_MODEL", env.LOCAL_LLM_MODEL);
    setVal("BROWSER", env.BROWSER);
    setVal("VIDEO", env.VIDEO);
    setChecked("HEADLESS", env.HEADLESS);
    setVal("TIMEOUT", env.TIMEOUT);
    setVal("RETRIES", env.RETRIES);
    updateModelFields(env.AI_MODEL);
  }

  // ── Searchable list helpers ───────────────────────────────────────────────
  function populateList(selectId, items) {
    var select = el(selectId);
    select.innerHTML = "";
    for (var i = 0; i < items.length; i++) {
      var opt = document.createElement("option");
      opt.value = items[i];
      opt.textContent = items[i];
      select.appendChild(opt);
    }
  }

  function filterList(selectId, searchId, allItems) {
    var query = val(searchId).toLowerCase();
    var filtered = allItems.filter(function (i) { return i.toLowerCase().includes(query); });
    populateList(selectId, filtered);
  }

  // ── State ─────────────────────────────────────────────────────────────────
  var allTestCaseIds = [];
  var allTags = [];

  // ── TC search ─────────────────────────────────────────────────────────────
  el("tc-search").addEventListener("input", function () { filterList("tc-select", "tc-search", allTestCaseIds); });
  el("tc-select").addEventListener("change", function () { el("tc-search").value = val("tc-select"); });

  // ── Tag search ────────────────────────────────────────────────────────────
  el("tag-search").addEventListener("input", function () { filterList("tag-select", "tag-search", allTags); });
  el("tag-select").addEventListener("change", function () { el("tag-search").value = val("tag-select"); });

  // ── Buttons ───────────────────────────────────────────────────────────────
  el("btn-generate").addEventListener("click", function () {
    var tcId = val("tc-select") || val("tc-search");
    vscode.postMessage({ command: "generate", tcId: tcId });
  });

  el("btn-run-all").addEventListener("click", function () { vscode.postMessage({ command: "runAll" }); });

  el("btn-run-tag").addEventListener("click", function () {
    vscode.postMessage({ command: "runByTag", tag: val("tag-select") || val("tag-search") });
  });

  el("btn-run-headed").addEventListener("click", function () {
    vscode.postMessage({ command: "runHeaded", tag: val("tag-select") || val("tag-search") });
  });

  el("btn-debug").addEventListener("click", function () {
    vscode.postMessage({ command: "debug", tag: val("tag-select") || val("tag-search") });
  });

  el("btn-report").addEventListener("click", function () { vscode.postMessage({ command: "report" }); });

  // ── Custom Env ────────────────────────────────────────────────────────────
  var saveCustomEnvTimer = null;

  function scheduleSaveCustomEnv() {
    if (saveCustomEnvTimer) { clearTimeout(saveCustomEnvTimer); }
    saveCustomEnvTimer = setTimeout(function () {
      vscode.postMessage({ command: "saveCustomEnv", customEnv: collectCustomEnv() });
    }, 600);
  }

  function addEnvRow(key, value) {
    var container = el("custom-env-rows");
    var row = document.createElement("div");
    row.className = "env-row";
    row.innerHTML =
      '<input type="text" class="env-key" placeholder="KEY" value="' + (key || "") + '">' +
      '<input type="text" class="env-val" placeholder="VALUE" value="' + (value || "") + '">' +
      '<button class="btn-delete" title="Delete">&times;</button>';
    row.querySelector(".btn-delete").addEventListener("click", function () {
      container.removeChild(row);
      scheduleSaveCustomEnv();
    });
    row.querySelector(".env-key").addEventListener("input", scheduleSaveCustomEnv);
    row.querySelector(".env-val").addEventListener("input", scheduleSaveCustomEnv);
    container.appendChild(row);
  }

  function collectCustomEnv() {
    var result = {};
    var rows = el("custom-env-rows").querySelectorAll(".env-row");
    rows.forEach(function (row) {
      var key = row.querySelector(".env-key").value.trim();
      var value = row.querySelector(".env-val").value;
      if (key) { result[key] = value; }
    });
    return result;
  }

  el("btn-add-env").addEventListener("click", function () { addEnvRow("", ""); });

  // ── Messages from extension ───────────────────────────────────────────────
  window.addEventListener("message", function (event) {
    var msg = event.data;
    switch (msg.command) {
      case "init":
        applyEnv(msg.env);
        allTestCaseIds = msg.testCaseIds;
        allTags = msg.tags;
        populateList("tc-select", allTestCaseIds);
        populateList("tag-select", allTags);
        // Load custom env rows
        el("custom-env-rows").innerHTML = "";
        if (msg.customEnv) {
          Object.keys(msg.customEnv).forEach(function (key) {
            addEnvRow(key, msg.customEnv[key]);
          });
        }
        break;
      case "updateTestCaseIds":
        allTestCaseIds = msg.testCaseIds;
        filterList("tc-select", "tc-search", allTestCaseIds);
        break;
      case "updateTags":
        allTags = msg.tags;
        filterList("tag-select", "tag-search", allTags);
        break;
    }
  });
}());
