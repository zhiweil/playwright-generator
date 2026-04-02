(function () {
  const vscode = acquireVsCodeApi();

  // ── Helpers ───────────────────────────────────────────────────────────────
  function el(id) {
    return document.getElementById(id);
  }
  function val(id) {
    return el(id).value;
  }
  function setVal(id, v) {
    const e = el(id);
    if (e) {
      e.value = v ?? "";
    }
  }
  function setChecked(id, v) {
    const e = el(id);
    if (e) {
      e.checked = v === "true" || v === true;
    }
  }

  // ── Running state ─────────────────────────────────────────────────────────
  var INTERACTIVE = [
    "AI_MODEL",
    "CLAUDE_API_KEY",
    "AZURE_OPENAI_API_KEY",
    "AZURE_OPENAI_ENDPOINT",
    "AZURE_OPENAI_DEPLOYMENT",
    "AZURE_OPENAI_API_VERSION",
    "CHATGPT_API_KEY",
    "CHATGPT_MODEL",
    "LOCAL_LLM_URL",
    "LOCAL_LLM_MODEL",
    "BROWSER",
    "VIDEO",
    "HEADLESS",
    "TIMEOUT",
    "RETRIES",
    "tc-search",
    "tc-select",
    "tag-search",
    "tag-select",
    "helper-search",
    "btn-generate-helper",
    "btn-generate",
    "btn-run-all",
    "btn-run-tag",
    "btn-run-headed",
    "btn-debug",
    "btn-report",
    "btn-add-env",
  ];

  function setRunning(running) {
    INTERACTIVE.forEach(function (id) {
      var e = el(id);
      if (e) {
        e.disabled = running;
      }
    });
    el("custom-env-rows")
      .querySelectorAll("input, button")
      .forEach(function (e) {
        e.disabled = running;
      });
    var banner = el("running-banner");
    if (running) {
      banner.classList.remove("hidden");
    } else {
      banner.classList.add("hidden");
    }
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────
  document.querySelectorAll(".tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      document.querySelectorAll(".tab").forEach(function (t) {
        t.classList.remove("active");
      });
      document.querySelectorAll(".tab-panel").forEach(function (p) {
        p.classList.add("hidden");
      });
      tab.classList.add("active");
      var panelId = "tab-" + tab.getAttribute("data-tab");
      el(panelId).classList.remove("hidden");
    });
  });

  // ── Model field visibility ────────────────────────────────────────────────
  function updateModelFields(model) {
    var all = [
      "claude-fields",
      "azure-fields",
      "chatgpt-fields",
      "local-fields",
    ];
    var map = {
      claude: "claude-fields",
      "azure-openai": "azure-fields",
      chatgpt: "chatgpt-fields",
      local: "local-fields",
    };
    for (var i = 0; i < all.length; i++) {
      el(all[i]).classList.add("hidden");
    }
    if (map[model]) {
      el(map[model]).classList.remove("hidden");
    }
  }

  el("AI_MODEL").addEventListener("change", function () {
    updateModelFields(val("AI_MODEL"));
    scheduleConfigSave();
  });

  // ── Config auto-save ──────────────────────────────────────────────────────
  var configSaveTimer = null;

  function collectEnv() {
    return {
      AI_MODEL: val("AI_MODEL"),
      CLAUDE_API_KEY: val("CLAUDE_API_KEY"),
      AZURE_OPENAI_API_KEY: val("AZURE_OPENAI_API_KEY"),
      AZURE_OPENAI_ENDPOINT: val("AZURE_OPENAI_ENDPOINT"),
      AZURE_OPENAI_DEPLOYMENT: val("AZURE_OPENAI_DEPLOYMENT"),
      AZURE_OPENAI_API_VERSION: val("AZURE_OPENAI_API_VERSION"),
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
    if (configSaveTimer) {
      clearTimeout(configSaveTimer);
    }
    configSaveTimer = setTimeout(function () {
      vscode.postMessage({ command: "saveEnv", env: collectEnv() });
    }, 600);
  }

  var configInputIds = [
    "CLAUDE_API_KEY",
    "AZURE_OPENAI_API_KEY",
    "AZURE_OPENAI_ENDPOINT",
    "AZURE_OPENAI_DEPLOYMENT",
    "AZURE_OPENAI_API_VERSION",
    "CHATGPT_API_KEY",
    "CHATGPT_MODEL",
    "LOCAL_LLM_URL",
    "LOCAL_LLM_MODEL",
    "TIMEOUT",
    "RETRIES",
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
    setVal("AZURE_OPENAI_DEPLOYMENT", env.AZURE_OPENAI_DEPLOYMENT);
    setVal("AZURE_OPENAI_API_VERSION", env.AZURE_OPENAI_API_VERSION);
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

  // ── Select list helpers ───────────────────────────────────────────────────
  // Always show ALL items; search box filters visibility via option hiding,
  // preserving the current selection.

  function populateList(selectId, items, preserveValue) {
    var select = el(selectId);
    var current = preserveValue !== undefined ? preserveValue : select.value;
    select.innerHTML = "";
    for (var i = 0; i < items.length; i++) {
      var opt = document.createElement("option");
      opt.value = items[i];
      opt.textContent = items[i];
      select.appendChild(opt);
    }
    if (current) {
      select.value = current;
    }
  }

  function populateTcList(entries, preserveValue) {
    var select = el("tc-select");
    var current = preserveValue !== undefined ? preserveValue : select.value;
    select.innerHTML = "";
    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i];
      var opt = document.createElement("option");
      opt.value = entry.id;
      opt.textContent = entry.id + (entry.duplicate ? " [Duplicate!]" : "");
      if (entry.duplicate) {
        opt.disabled = true;
        opt.style.color = "var(--vscode-disabledForeground, #888)";
      }
      select.appendChild(opt);
    }
    if (current) { select.value = current; }
  }

  function populateTcList(entries, preserveValue) {
    var select = el("tc-select");
    var current = preserveValue !== undefined ? preserveValue : select.value;
    select.innerHTML = "";
    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i];
      var opt = document.createElement("option");
      opt.value = entry.id;
      opt.textContent = entry.id + (entry.duplicate ? " [Duplicate!]" : "");
      if (entry.duplicate) {
        opt.disabled = true;
        opt.style.color = "var(--vscode-disabledForeground, #888)";
      }
      select.appendChild(opt);
    }
    if (current) { select.value = current; }
  }

  // Filter by hiding non-matching options, keeping all in DOM
  function applyListFilter(selectId, query) {
    var select = el(selectId);
    var opts = select.querySelectorAll("option");
    var q = query.toLowerCase();
    opts.forEach(function (opt) {
      if (opt.disabled) { return; }
      opt.hidden = q.length > 0 && !opt.value.toLowerCase().includes(q);
    });
  }

  // ── State ─────────────────────────────────────────────────────────────────
  var allTestCaseIds = [];
  var allTags = [];
  var allHelpers = [];

  // ── TC list ───────────────────────────────────────────────────────────────
  var selectedTcId = "";

  el("tc-search").addEventListener("input", function () {
    applyListFilter("tc-select", val("tc-search"));
  });

  el("tc-select").addEventListener("change", function () {
    selectedTcId = val("tc-select");
  });

  // ── Tag list ──────────────────────────────────────────────────────────────
  var selectedTag = "";

  el("tag-search").addEventListener("input", function () {
    applyListFilter("tag-select", val("tag-search"));
  });

  el("tag-select").addEventListener("change", function () {
    selectedTag = val("tag-select");
  });

  // ── Helpers table ─────────────────────────────────────────────────────────
  var selectedHelperName = "";

  function populateHelperTable(helpers, preserveSelection) {
    var tbody = el("helper-tbody");
    if (!tbody) {
      return;
    }
    var searchEl = el("helper-search");
    var query = searchEl ? searchEl.value.toLowerCase() : "";
    tbody.innerHTML = "";
    helpers.forEach(function (h) {
      var tr = document.createElement("tr");
      tr.setAttribute("data-name", h.name);
      var actionsText = h.generated
        ? h.actions.length > 0
          ? h.actions.join(", ")
          : "—"
        : "⏳ Not generated yet";
      var actionsClass = h.generated
        ? "helper-actions-cell"
        : "helper-actions-cell helper-pending";
      var td1 = document.createElement("td");
      td1.className = "helper-name-cell";
      td1.title = h.name;
      td1.textContent = h.name;
      var td2 = document.createElement("td");
      td2.className = actionsClass;
      td2.title = actionsText;
      td2.textContent = actionsText;
      tr.appendChild(td1);
      tr.appendChild(td2);
      // Hide row if search doesn't match name
      if (query && !h.name.toLowerCase().includes(query)) {
        tr.style.display = "none";
      } else {
        tr.style.display = "";
      }
      // Restore selection
      if (preserveSelection && h.name === selectedHelperName) {
        tr.classList.add("selected");
      }
      tr.addEventListener("click", function () {
        tbody.querySelectorAll("tr").forEach(function (r) {
          r.classList.remove("selected");
        });
        tr.classList.add("selected");
        selectedHelperName = h.name;
      });
      tbody.appendChild(tr);
    });
  }

  el("helper-search").addEventListener("input", function () {
    populateHelperTable(allHelpers, true);
  });

  document.addEventListener("click", function (e) {
    if (e.target && e.target.id === "btn-generate-helper") {
      var name =
        selectedHelperName ||
        (el("helper-search") ? el("helper-search").value.trim() : "");
      if (!name) {
        return;
      }
      vscode.postMessage({ command: "generateHelper", helperName: name });
    }
  });

  // ── Buttons ───────────────────────────────────────────────────────────────
  el("btn-generate").addEventListener("click", function () {
    var tcId = selectedTcId || val("tc-search");
    vscode.postMessage({ command: "generate", tcId: tcId });
  });

  el("btn-run-all").addEventListener("click", function () {
    vscode.postMessage({ command: "runAll" });
  });

  el("btn-run-tag").addEventListener("click", function () {
    vscode.postMessage({
      command: "runByTag",
      tag: selectedTag || val("tag-search"),
    });
  });

  el("btn-run-headed").addEventListener("click", function () {
    vscode.postMessage({
      command: "runHeaded",
      tag: selectedTag || val("tag-search"),
    });
  });

  el("btn-debug").addEventListener("click", function () {
    vscode.postMessage({
      command: "debug",
      tag: selectedTag || val("tag-search"),
    });
  });

  el("btn-report").addEventListener("click", function () {
    vscode.postMessage({ command: "report" });
  });

  // ── Custom Env ────────────────────────────────────────────────────────────
  var saveCustomEnvTimer = null;

  function scheduleSaveCustomEnv() {
    if (saveCustomEnvTimer) {
      clearTimeout(saveCustomEnvTimer);
    }
    saveCustomEnvTimer = setTimeout(function () {
      vscode.postMessage({
        command: "saveCustomEnv",
        customEnv: collectCustomEnv(),
      });
    }, 600);
  }

  function addEnvRow(key, value) {
    var container = el("custom-env-rows");
    var row = document.createElement("div");
    row.className = "env-row";
    var keyInput = document.createElement("input");
    keyInput.type = "text";
    keyInput.className = "env-key";
    keyInput.placeholder = "KEY";
    keyInput.value = key || "";
    var valInput = document.createElement("input");
    valInput.type = "text";
    valInput.className = "env-val";
    valInput.placeholder = "VALUE";
    valInput.value = value || "";
    var delBtn = document.createElement("button");
    delBtn.className = "btn-delete";
    delBtn.title = "Delete";
    delBtn.textContent = "\u00d7";
    row.appendChild(keyInput);
    row.appendChild(valInput);
    row.appendChild(delBtn);
    delBtn.addEventListener("click", function () {
      container.removeChild(row);
      scheduleSaveCustomEnv();
    });
    keyInput.addEventListener("input", scheduleSaveCustomEnv);
    valInput.addEventListener("input", scheduleSaveCustomEnv);
    container.appendChild(row);
  }

  function collectCustomEnv() {
    var result = {};
    var rows = el("custom-env-rows").querySelectorAll(".env-row");
    rows.forEach(function (row) {
      var key = row.querySelector(".env-key").value.trim();
      var value = row.querySelector(".env-val").value;
      if (key) {
        result[key] = value;
      }
    });
    return result;
  }

  el("btn-add-env").addEventListener("click", function () {
    addEnvRow("", "");
  });

  // ── Messages from extension ───────────────────────────────────────────────
  window.addEventListener("message", function (event) {
    // Only accept messages from the extension host (vscode-webview origin)
    if (event.origin && !event.origin.startsWith("vscode-webview://")) { return; }
    var msg = event.data;
    switch (msg.command) {
      case "init":
        applyEnv(msg.env);
        allTestCaseIds = msg.testCaseIds;
        allTags = msg.tags;
        allHelpers = msg.helpers || [];
        selectedTcId = "";
        selectedTag = "";
        selectedHelperName = "";
        populateTcList(allTestCaseIds);
        populateList("tag-select", allTags);
        populateHelperTable(allHelpers, false);
        el("custom-env-rows").innerHTML = "";
        if (msg.customEnv) {
          Object.keys(msg.customEnv).forEach(function (key) {
            addEnvRow(key, msg.customEnv[key]);
          });
        }
        break;
      case "updateTestCaseIds":
        allTestCaseIds = msg.testCaseIds;
        populateTcList(allTestCaseIds, selectedTcId);
        applyListFilter("tc-select", val("tc-search"));
        break;
      case "updateTags":
        allTags = msg.tags;
        populateList("tag-select", allTags, selectedTag);
        applyListFilter("tag-select", val("tag-search"));
        break;
      case "updateHelpers":
        allHelpers = msg.helpers || [];
        populateHelperTable(allHelpers, true);
        break;
      case "setRunning":
        setRunning(msg.running);
        break;
    }
  });
  // ── Signal ready to extension host ──────────────────────────────────────
  vscode.postMessage({ command: "ready" });
})();
