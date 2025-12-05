function createTextNode(text) {
	return document.createTextNode(text);
}

function createElement(elementName, { children, text, id, classList, dataset, eventHandlers } = {}) {
	const element = document.createElement(elementName);
	if (id) {
		element.id = id;
	}
	if (dataset) {
		Object.entries(dataset).forEach(([key, value]) => {
			element.dataset[key] = value;
		});
	}
	if (classList) {
		classList.forEach(className => {
			element.classList.add(className);
		});
	}
	if (text) {
		element.textContent = text;
	} else if (children) {
		for (const child of children) {
			element.appendChild(child);
		}
	}
    if (eventHandlers) {
        for (const key of Object.keys(eventHandlers)) {
            element.addEventListener(key, eventHandlers[key]);
        }
    }

	return element;
}
