// @ts-check
(function () {
  const vscode = acquireVsCodeApi();

  // ── Helpers ──────────────────────────────────────────────────────────────
  function el(id) { return document.getElementById(id); }

  function val(id) { return el(id).value; }

  function setVal(id, v) {
    const e = el(id);
    if (e) { e.value = v ?? ""; }
  }

  function setChecked(id, v) {
    const e = el(id);
    if (e) { e.checked = v === "true" || v === true; }
  }

  // ── Model field visibility ────────────────────────────────────────────────
  function updateModelFields(model) {
    const all = ["claude-fields", "azure-fields", "chatgpt-fields", "local-fields"];
    const map = {
      "claude": "claude-fields",
      "azure-openai": "azure-fields",
      "chatgpt": "chatgpt-fields",
      "local": "local-fields",
    };
    for (const id of all) { el(id).classList.add("hidden"); }
    if (map[model]) { el(map[model]).classList.remove("hidden"); }
  }

  el("AI_MODEL").addEventListener("change", () => updateModelFields(val("AI_MODEL")));

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
    const select = el(selectId);
    select.innerHTML = "";
    for (const item of items) {
      const opt = document.createElement("option");
      opt.value = item;
      opt.textContent = item;
      select.appendChild(opt);
    }
  }

  function filterList(selectId, searchId, allItems) {
    const query = val(searchId).toLowerCase();
    const filtered = allItems.filter((i) => i.toLowerCase().includes(query));
    populateList(selectId, filtered);
  }

  // ── State ─────────────────────────────────────────────────────────────────
  let allTestCaseIds = [];
  let allTags = [];

  // ── TC search ─────────────────────────────────────────────────────────────
  el("tc-search").addEventListener("input", () => filterList("tc-select", "tc-search", allTestCaseIds));

  // Sync search box when user clicks a list item
  el("tc-select").addEventListener("change", () => {
    el("tc-search").value = val("tc-select");
  });

  // ── Tag search ────────────────────────────────────────────────────────────
  el("tag-search").addEventListener("input", () => filterList("tag-select", "tag-search", allTags));

  el("tag-select").addEventListener("change", () => {
    el("tag-search").value = val("tag-select");
  });

  // ── Buttons ───────────────────────────────────────────────────────────────
  el("btn-save").addEventListener("click", () => {
    vscode.postMessage({
      command: "saveEnv",
      env: {
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
      },
    });
  });

  el("btn-generate").addEventListener("click", () => {
    const tcId = val("tc-select") || val("tc-search");
    vscode.postMessage({ command: "generate", tcId });
  });

  el("btn-run-all").addEventListener("click", () => vscode.postMessage({ command: "runAll" }));

  el("btn-run-tag").addEventListener("click", () => {
    vscode.postMessage({ command: "runByTag", tag: val("tag-select") || val("tag-search") });
  });

  el("btn-run-headed").addEventListener("click", () => {
    vscode.postMessage({ command: "runHeaded", tag: val("tag-select") || val("tag-search") });
  });

  el("btn-debug").addEventListener("click", () => {
    vscode.postMessage({ command: "debug", tag: val("tag-select") || val("tag-search") });
  });

  el("btn-report").addEventListener("click", () => vscode.postMessage({ command: "report" }));

  // ── Messages from extension ───────────────────────────────────────────────
  window.addEventListener("message", (event) => {
    const msg = event.data;
    switch (msg.command) {
      case "init":
        applyEnv(msg.env);
        allTestCaseIds = msg.testCaseIds;
        allTags = msg.tags;
        populateList("tc-select", allTestCaseIds);
        populateList("tag-select", allTags);
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
