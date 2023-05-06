const findCopyNode = () =>
  [...document.getElementsByTagName("code")].find(
    (e) => e.title == "Copy Command to Clipboard"
  ).parentNode;

const createSiblingNode = (originalNode) =>
  originalNode.parentNode
    .insertBefore(originalNode.cloneNode(true), originalNode)
    .getElementsByTagName("span")[0];

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

  if (newNode) {
    newNode.innerText = newNode.innerText
      .replace("npm", "yarn")
      .replace(" i ", " add ")
      .replace("install", "add")
      .replace("--save-dev", "--dev");

    addCopyOnClick(newNode);
  }
};

const createPnpmNode = (originalNode) => {
  const newNode = createSiblingNode(originalNode);

  if (newNode) {
    newNode.innerText = newNode.innerText
      .replace("npm", "pnpm")
      .replace(" i ", " add ")
      .replace("install", "install")
      .replace("--save-dev", "-D");

    addCopyOnClick(newNode);
  }
};

const replaceNpmNode = (originalNode) => {
  const newNode = createSiblingNode(originalNode);

  if (newNode) {
    addCopyOnClick(newNode);
    originalNode.remove();
  }
};

setTimeout(() => {
  const npmNode = findCopyNode();
  if (npmNode) {
    createYarnNode(npmNode);
    createPnpmNode(npmNode);
    replaceNpmNode(npmNode);
  }
}, 100);
