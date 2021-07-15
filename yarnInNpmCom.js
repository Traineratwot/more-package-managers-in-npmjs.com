setTimeout(() => {
	const node = [...document.getElementsByTagName("code")].find(
		(e) => e.title == "Copy Command to Clipboard"
	).parentNode;
	if (node) {
		const newNode = node.parentNode
			.insertBefore(node.cloneNode(true), node)
			.getElementsByTagName("span")[0];

		if (newNode) {
			newNode.innerText = newNode.innerText
				.replace("npm", "yarn")
				.replace(" i ", " add ")
				.replace("install", "add")
				.replace("--save-dev", "--dev");
			const innerText = newNode.innerText;

			newNode.addEventListener('click', (e) => {
				navigator.clipboard.writeText(innerText)
				newNode.innerHTML = "Copied! ✅";
				setTimeout(() => {
					newNode.innerText = innerText;
				}, 1000);
			});
		}
	}
}, 100);
