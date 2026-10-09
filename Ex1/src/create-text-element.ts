import { TEXT_ELEMENT, type TextVNode } from "./vnode.ts";

export function createTextElement(text: string | number): TextVNode {
  if (typeof text !== "string" && typeof text !== "number") {
    throw new TypeError("createTextElement expects a string or number.");
  }

  const children = Object.freeze([]) as readonly [];
  const props = Object.freeze({
    nodeValue: String(text),
    children,
  });

  return Object.freeze({
    type: TEXT_ELEMENT,
    props,
  });
}
