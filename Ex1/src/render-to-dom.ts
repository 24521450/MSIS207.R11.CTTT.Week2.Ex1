import { registerClickHandler } from "./event-delegation.ts";
import { isStyleObject, isVNode } from "./vnode-guards.ts";
import { TEXT_ELEMENT, type VNode, type VNodePropValue } from "./vnode.ts";

const BOOLEAN_ATTRIBUTES: ReadonlySet<string> = new Set([
  "allowfullscreen",
  "async",
  "autofocus",
  "autoplay",
  "checked",
  "controls",
  "default",
  "defer",
  "disabled",
  "formnovalidate",
  "hidden",
  "inert",
  "ismap",
  "itemscope",
  "loop",
  "multiple",
  "muted",
  "nomodule",
  "novalidate",
  "open",
  "playsinline",
  "readonly",
  "required",
  "reversed",
  "selected",
]);

const BOOLEAN_OR_STRING_ATTRIBUTES: ReadonlySet<string> = new Set(["capture", "download"]);

const ATTRIBUTE_NAME_MAP: Readonly<Record<string, string>> = Object.freeze({
  allowFullScreen: "allowfullscreen",
  autoFocus: "autofocus",
  className: "class",
  formNoValidate: "formnovalidate",
  htmlFor: "for",
  noValidate: "novalidate",
  readOnly: "readonly",
  tabIndex: "tabindex",
});

function toAttributeName(property: string): string {
  return ATTRIBUTE_NAME_MAP[property] ?? property;
}

function assertAttributeName(name: string): void {
  if (!/^[A-Za-z_:][A-Za-z0-9:._-]*$/.test(name)) {
    throw new TypeError(`Unsupported HTML attribute name "${name}".`);
  }
}

function toCssPropertyName(property: string): string {
  if (property.startsWith("--")) {
    return property;
  }
  return property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function applyStyle(element: HTMLElement, value: unknown): void {
  if (value === null || value === undefined) {
    return;
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError('The "style" prop must be an object of CSS strings.');
  }

  for (const [property, cssValue] of Object.entries(value)) {
    if (typeof cssValue !== "string") {
      throw new TypeError(`Style value for "${property}" must be a CSS string.`);
    }
    element.style.setProperty(toCssPropertyName(property), cssValue);
  }
}

function isRenderablePropValue(property: string, value: unknown): value is VNodePropValue {
  if (property === "style") {
    return value === null || value === undefined || isStyleObject(value);
  }
  if (/^on/i.test(property)) {
    return (
      property === "onClick" &&
      (value === null || value === undefined || typeof value === "function")
    );
  }
  return (
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

function applyAttribute(element: HTMLElement, property: string, value: VNodePropValue): void {
  if (property === "children" || property === "nodeValue" || property === "key") {
    return;
  }

  if (/^on/i.test(property)) {
    if (property === "onClick" && typeof value === "function") {
      registerClickHandler(element, value);
    }
    return;
  }

  if (property === "style") {
    applyStyle(element, value);
    return;
  }

  if (value === null || value === undefined) {
    return;
  }

  const attributeName = toAttributeName(property);
  assertAttributeName(attributeName);
  const lowerName = attributeName.toLowerCase();

  if (BOOLEAN_ATTRIBUTES.has(lowerName)) {
    if (typeof value !== "boolean") {
      throw new TypeError(`Boolean HTML attribute "${attributeName}" expects a boolean value.`);
    }
    if (value) {
      element.setAttribute(attributeName, "");
    }
    return;
  }

  if (BOOLEAN_OR_STRING_ATTRIBUTES.has(lowerName) && typeof value === "boolean") {
    if (value) {
      element.setAttribute(attributeName, "");
    }
    return;
  }

  if (property === "className" && typeof value !== "string") {
    throw new TypeError('The "className" prop must be a string.');
  }

  element.setAttribute(attributeName, String(value));
}

function renderValidatedVNode(vNode: VNode): Node {
  if (vNode.type === TEXT_ELEMENT) {
    return document.createTextNode(vNode.props.nodeValue);
  }

  const element = document.createElement(vNode.type);
  for (const [property, value] of Object.entries(vNode.props)) {
    if (property === "children") {
      continue;
    }
    if (!isRenderablePropValue(property, value)) {
      throw new TypeError(`Unsupported value for VNode prop "${property}".`);
    }
    applyAttribute(element, property, value);
  }

  for (const child of vNode.props.children) {
    element.appendChild(renderValidatedVNode(child));
  }

  return element;
}

/** Validates the complete VNode tree, then creates a detached DOM tree using DOM APIs only. */
export function renderToDOM(value: unknown): Node {
  if (!isVNode(value)) {
    throw new TypeError("renderToDOM expects a valid native-element or text VNode.");
  }

  return renderValidatedVNode(value);
}
