export class FakeNode {
  constructor(nodeType) {
    this.nodeType = nodeType;
    this.parentElement = null;
    this.childNodes = [];
  }

  appendChild(node) {
    if (node.parentElement !== null) {
      node.parentElement.removeChild(node);
    }
    this.childNodes.push(node);
    node.parentElement = this;
    return node;
  }

  removeChild(node) {
    const index = this.childNodes.indexOf(node);
    if (index < 0) {
      throw new Error("Node is not a child of this parent.");
    }
    this.childNodes.splice(index, 1);
    node.parentElement = null;
    return node;
  }

  replaceChildren(...nodes) {
    for (const child of this.childNodes) {
      child.parentElement = null;
    }
    this.childNodes = [];
    for (const node of nodes) {
      this.appendChild(node);
    }
  }

  contains(node) {
    return this === node || this.childNodes.some((child) => child.contains(node));
  }

  get textContent() {
    if (this.nodeType === 3) {
      return this.data;
    }
    return this.childNodes.map((child) => child.textContent).join("");
  }
}

export class FakeStyle {
  constructor() {
    this.values = new Map();
  }

  setProperty(name, value) {
    if (value === "") {
      this.values.delete(name);
      return;
    }
    this.values.set(name, value);
  }
}

export class FakeElement extends FakeNode {
  constructor(tagName, ownerDocument) {
    super(1);
    this.tagName = tagName.toUpperCase();
    this.localName = tagName;
    this.ownerDocument = ownerDocument;
    this.attributes = new Map();
    this.style = new FakeStyle();
    this.listeners = new Map();
  }

  setAttribute(name, value) {
    this.attributes.set(name.toLowerCase(), String(value));
  }

  getAttribute(name) {
    return this.attributes.get(name.toLowerCase()) ?? null;
  }

  addEventListener(type, listener) {
    const handlers = this.listeners.get(type) ?? new Set();
    handlers.add(listener);
    this.listeners.set(type, handlers);
  }

  removeEventListener(type, listener) {
    this.listeners.get(type)?.delete(listener);
  }

  listenerCount(type) {
    return this.listeners.get(type)?.size ?? 0;
  }

  dispatchEvent(event) {
    if (event.target === null) {
      event.target = this;
    }
    let current = this;
    while (current !== null) {
      event.currentTarget = current;
      for (const listener of [...(current.listeners.get(event.type) ?? [])]) {
        listener(event);
      }
      if (!event.bubbles) {
        break;
      }
      current = current.parentElement;
    }
    return !event.defaultPrevented;
  }
}

export class FakeText extends FakeNode {
  constructor(data) {
    super(3);
    this.data = data;
  }
}

export class FakeEvent {
  constructor(type) {
    this.type = type;
    this.target = null;
    this.currentTarget = null;
    this.bubbles = true;
    this.defaultPrevented = false;
  }
}

export class FakeDocument {
  constructor() {
    this.createdElements = [];
    this.defaultView = { Element: FakeElement };
  }

  createElement(tagName) {
    this.createdElements.push(tagName);
    return new FakeElement(tagName, this);
  }

  createTextNode(data) {
    return new FakeText(data);
  }
}
