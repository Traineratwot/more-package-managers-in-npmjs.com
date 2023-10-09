const isTypesPackage = () => document.title.includes("@types");

let isDevDependency = isTypesPackage();
let buttonNodes = [];

const findNpmNode = () =>
  [...document.getElementsByTagName("code")].find(
    (e) => e.title == "Copy Command to Clipboard"
  ).parentNode;

const createSiblingNode = (originalNode) =>
  originalNode.parentNode.insertBefore(
    originalNode.cloneNode(true),
    originalNode
  );

const addCopyOnClick = (node) => {
  const { innerText } = node;

  const eventHandler = () => {
    navigator.clipboard.writeText(innerText);
    node.innerHTML = "Copied! ✅";
    setTimeout(() => {
      node.innerText = innerText;
    }, 1000);
  };

  node.addEventListener("click", eventHandler);
};

const createYarnNode = (originalNode) => {
  const newNode = createSiblingNode(originalNode);
  if (!newNode) return;

  const textNode = newNode.getElementsByTagName("button")[0];
  if (!textNode) return;

  textNode.innerText = textNode.innerText
    .replace("npm", "yarn")
    .replace(" i ", isDevDependency ? " add --dev " : " add ");

  addCopyOnClick(textNode);

  return newNode;
};

const createPnpmNode = (originalNode) => {
  const newNode = createSiblingNode(originalNode);
  if (!newNode) return;

  const textNode = newNode.getElementsByTagName("button")[0];
  if (!textNode) return;

  textNode.innerText = textNode.innerText
    .replace("npm", "pnpm")
    .replace(" i ", isDevDependency ? " add -D " : " add ");

  addCopyOnClick(textNode);

  return newNode;
};

const replaceNpmNode = (originalNode) => {
  const newNode = createSiblingNode(originalNode);
  if (!newNode) return;

  const textNode = newNode.getElementsByTagName("button")[0];
  if (!textNode) return;

  textNode.innerText = textNode.innerText.replace(
    " i ",
    isDevDependency ? " i --save-dev " : " i "
  );

  addCopyOnClick(textNode);
  originalNode.remove();

  return newNode;
};

const recreateNode = (originalNode) => {
  const newNode = originalNode.cloneNode(true);
  if (!newNode) return;

  const textNode = newNode.getElementsByTagName("button")[0];
  if (!textNode) return;

  if (isDevDependency) {
    textNode.innerText = textNode.innerText
      .replace("npm i ", "npm i --save-dev ")
      .replace("yarn add ", "yarn add --dev ")
      .replace("pnpm add ", "pnpm add -D ");
  } else {
    textNode.innerText = textNode.innerText
      .replaceAll(" --save-dev", "")
      .replaceAll(" --dev", "")
      .replaceAll(" -D", "");
  }

  addCopyOnClick(textNode);
  originalNode.parentNode.replaceChild(newNode, originalNode);
  return newNode;
};

const recreateAllNodes = () => {
  buttonNodes = buttonNodes.map(recreateNode);
};

const addDevelopmentPackageCheckbox = (siblingNode) => {
  const newDiv = document.createElement("div");
  newDiv.style.color = "rgba(0,0,0,.8)";
  newDiv.style.fontFamily = "'Fira Mono', 'Andale Mono', 'Consolas', monospace";
  newDiv.style.letterSpacing = 0;
  newDiv.style.fontSize = ".875rem";

  const newContent = document.createTextNode("Development dependency: ");

  newDiv.appendChild(newContent);

  const newCheckbox = document.createElement("input");
  newCheckbox.type = "checkbox";
  newCheckbox.checked = isDevDependency;
  newCheckbox.addEventListener("click", (cb) => {
    isDevDependency = cb.target.checked;
    recreateAllNodes();
  });
  newDiv.appendChild(newCheckbox);

  siblingNode.parentNode.insertBefore(newDiv, siblingNode);
};

setTimeout(() => {
  const npmNode = findNpmNode();

  if (npmNode) {
    npmNode.style.margin = "6px 0";

    buttonNodes = [
      createYarnNode(npmNode),
      createPnpmNode(npmNode),
      replaceNpmNode(npmNode),
    ];

    console.log(buttonNodes);
    addDevelopmentPackageCheckbox(buttonNodes[0]);
  }
}, 100);
