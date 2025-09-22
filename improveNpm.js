// ============ helpers ============

const STORAGE_KEYS = {
  managers: "pmVisibility",
  spoiler: "pmSpoilerOpen",
};

const DEFAULT_MANAGERS = { npm: true, yarn: true, pnpm: true, bun: true };

const isTypesPackage = () => document.title.includes("@types");
let isDevDependency = isTypesPackage();

let nodeMap = /** @type {Record<'npm'|'yarn'|'pnpm'|'bun', HTMLElement|null>} */ ({
  npm: null,
  yarn: null,
  pnpm: null,
  bun: null,
});

let visibility = loadManagersVisibility();
let spoilerOpen = loadSpoilerState();

function loadManagersVisibility() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.managers);
    if (!raw) return { ...DEFAULT_MANAGERS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_MANAGERS, ...parsed };
  } catch {
    return { ...DEFAULT_MANAGERS };
  }
}

function saveManagersVisibility(v) {
  localStorage.setItem(STORAGE_KEYS.managers, JSON.stringify(v));
}

function loadSpoilerState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.spoiler);
    if (raw === null) return false;
    return raw === "true";
  } catch {
    return false;
  }
}

function saveSpoilerState(open) {
  localStorage.setItem(STORAGE_KEYS.spoiler, String(open));
}

const findNpmNode = () =>
  document.querySelector('button[aria-label="Copy install command line"]')
    ?.parentNode?.parentNode;

const createSiblingNode = (originalNode) =>
  originalNode.parentNode.insertBefore(originalNode.cloneNode(true), originalNode);

function addCopyOnClick(node) {
  const copyButton = node.querySelector("button");
  const codeNode = node.querySelector("code");
  if (!copyButton || !codeNode) return;

  // Чтобы не навешивать повторно
  if (copyButton.__copyHandlerAttached) return;
  copyButton.__copyHandlerAttached = true;

  copyButton.addEventListener("click", () => {
    const text = codeNode.innerText;
    navigator.clipboard.writeText(text);
    const prev = codeNode.innerText;
    codeNode.innerHTML = "Copied! ✅";
    setTimeout(() => (codeNode.innerText = prev), 1000);
  });
}

// Очистить любые dev-флаги
function stripDevFlags(text) {
  return text
    .replace(/(?:^|\s)--save-dev\b/g, "")
    .replace(/(?:^|\s)--dev\b/g, "")
    .replace(/(?:^|\s)-D\b/g, "")
    .replace(/(?:^|\s)-d\b/g, "")
    .replace(/\s{2,}/g, " ") // подчистим двойные пробелы
    .trim();
}

// Привести команду к нужному менеджеру и dev-состоянию
function buildCommand(originalText, manager, isDev) {
  let text = originalText;

  // 1) Нормализуем шапку команды (менеджер + подкоманда)
  // Меняем "xxx i|install|add" на "<manager> i/add"
  const header = manager === "npm" ? "npm i" : `${manager} add`;
  text = text.replace(
    /^(?:\s*)(npm|yarn|pnpm|bun)\s+(?:i|install|add)\b/i,
    header
  );

  // Если вдруг не совпало (редкий случай) — принудительно префиксуем
  if (!/^(npm i|yarn add|pnpm add|bun add)\b/i.test(text)) {
    // забираем всё, кроме первого слова+команды, если оно было нераспознано
    const pkgPart = text.replace(/^(?:\s*)(npm|yarn|pnpm|bun)\b.*/i, "").trim();
    text = `${header}${pkgPart ? " " + pkgPart : ""}`;
  }

  // 2) Очищаем dev-флаги
  text = stripDevFlags(text);

  // 3) Добавляем нужный dev-флаг
  if (isDev) {
    const flag =
      manager === "npm"
        ? "--save-dev"
        : manager === "yarn"
        ? "--dev"
        : manager === "pnpm"
        ? "-D"
        : "-d"; // bun
    text = text.replace(/^(npm i|yarn add|pnpm add|bun add)\b/i, `$1 ${flag}`);
  }

  // Нормализуем пробелы
  return text.replace(/\s{2,}/g, " ").trim();
}

// Универсальное перестроение команды в узле на основе текущего текста
function recreateNode(node) {
  if (!node) return node;
  const code = node.querySelector("code");
  if (!code) return node;

  const m = code.innerText.match(/^(npm|yarn|pnpm|bun)\b/i);
  const pm = m ? m[1].toLowerCase() : "npm";
  code.innerText = buildCommand(code.innerText, pm, isDevDependency);
  return node;
}

function recreateAllNodes() {
  Object.values(nodeMap).forEach((node) => node && recreateNode(node));
}

// ============ creation of PM nodes ============

function createPMNodeFrom(originalNode, manager) {
  const newNode = createSiblingNode(originalNode);
  if (!newNode) return null;
  const code = newNode.querySelector("code");
  if (!code) return null;

  // Построим команду корректно
  code.innerText = buildCommand(code.innerText, manager, isDevDependency);

  addCopyOnClick(newNode);
  // Пометим для удобства
  newNode.dataset.pm = manager;
  newNode.style.margin = "6px 0";
  return newNode;
}

function replaceNpmWithNormalized(npmNode) {
  const newNode = createSiblingNode(npmNode);
  if (!newNode) return null;

  const code = newNode.querySelector("code");
  if (!code) return null;

  code.innerText = buildCommand(code.innerText, "npm", isDevDependency);
  addCopyOnClick(newNode);

  newNode.dataset.pm = "npm";
  newNode.style.margin = "6px 0";
  npmNode.remove();
  return newNode;
}

// ============ UI ============

function addDevCheckbox(anchorNode) {
  const wrap = document.createElement("div");
  wrap.style.color = "rgba(0,0,0,.8)";
  wrap.style.fontFamily = "'Fira Mono','Andale Mono','Consolas',monospace";
  wrap.style.fontSize = ".875rem";
  wrap.style.margin = "4px 0 8px 0";
  wrap.style.display = "flex";
  wrap.style.alignItems = "center";
  wrap.style.gap = "8px";

  const label = document.createElement("label");
  label.textContent = "📦 dev dependency";

  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.checked = isDevDependency;
  cb.style.verticalAlign = "middle";
  cb.addEventListener("change", (e) => {
    isDevDependency = e.target.checked; // не сохраняем в localStorage
    recreateAllNodes(); // обновить команды без перезагрузки
  });

  label.prepend(cb);
  wrap.appendChild(label);

  anchorNode.parentNode.insertBefore(wrap, anchorNode);
  return wrap;
}

function applyVisibility() {
  Object.entries(nodeMap).forEach(([pm, node]) => {
    if (!node) return;
    node.style.display = visibility[pm] ? "" : "none";
  });
}

function addManagersSpoiler(afterNode) {
  const details = document.createElement("details");
  details.open = !!spoilerOpen;

  const summary = document.createElement("summary");
  summary.textContent = "⚙️ Package Managers";
  summary.style.cursor = "pointer";
  summary.style.margin = "6px 0";
  details.appendChild(summary);

  const body = document.createElement("div");
  body.style.padding = "6px 0 0 0";
  body.style.display = "flex";
  body.style.flexDirection = "column";
  body.style.gap = "6px";

  const checklist = document.createElement("div");
  checklist.style.display = "grid";
  checklist.style.gridTemplateColumns = "repeat(2, max-content)";
  checklist.style.gap = "6px 16px";

  ["npm", "yarn", "pnpm", "bun"].forEach((pm) => {
    const label = document.createElement("label");
    label.style.userSelect = "none";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = !!visibility[pm];
    input.addEventListener("change", () => {
      visibility[pm] = input.checked;
      saveManagersVisibility(visibility);
      applyVisibility(); // обновляем сразу, без перезагрузки
    });
    label.appendChild(input);
    label.append(" " + pm);
    checklist.appendChild(label);
  });

  const resetBtn = document.createElement("button");
  resetBtn.textContent = "Reset to defaults";
  resetBtn.style.width = "fit-content";
  resetBtn.addEventListener("click", () => {
    // Сохраняем текущее состояние спойлера, чтобы оно осталось после reload
    saveSpoilerState(details.open);
    // Сброс видимости к дефолту
    visibility = { ...DEFAULT_MANAGERS };
    saveManagersVisibility(visibility);
    // Перезагрузка страницы (по требованию)
    location.reload();
  });

  details.addEventListener("toggle", () => {
    saveSpoilerState(details.open);
  });

  body.appendChild(checklist);
  body.appendChild(resetBtn);
  details.appendChild(body);

  afterNode.parentNode.insertBefore(details, afterNode.nextSibling);
  return details;
}

// ============ bootstrap ============

setTimeout(() => {
  const baseNpmNode = findNpmNode();
  if (!baseNpmNode) return;

  // Создаём узлы под все менеджеры
  const yarnNode = createPMNodeFrom(baseNpmNode, "yarn");
  const pnpmNode = createPMNodeFrom(baseNpmNode, "pnpm");
  const bunNode = createPMNodeFrom(baseNpmNode, "bun");
  const npmNode = replaceNpmWithNormalized(baseNpmNode);

  // Сохраняем ссылки
  nodeMap = {
    npm: npmNode,
    yarn: yarnNode,
    pnpm: pnpmNode,
    bun: bunNode,
  };

  // Вставляем чекбокс Dev перед первым блоком
  const firstVisibleNode =
    yarnNode || pnpmNode || bunNode || npmNode || baseNpmNode;
  if (firstVisibleNode) addDevCheckbox(firstVisibleNode);

  // Применяем видимость по настройкам
  applyVisibility();

  // Добавляем спойлер с настройками после последнего узла менеджеров
  const lastNode = npmNode || bunNode || pnpmNode || yarnNode;
  if (lastNode) addManagersSpoiler(lastNode);
}, 100);
