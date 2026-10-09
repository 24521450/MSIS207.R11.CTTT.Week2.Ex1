import { createTextElement } from "./create-text-element.ts";
import {
  isMiniReactEventHandler,
  isVNode,
  isStyleObject,
  isStylePropertyName,
} from "./vnode-guards.ts";
import {
  TEXT_ELEMENT,
  isNativeElementType,
  type ElementProps,
  type NativeElementType,
  type NativeElementVNode,
  type VNode,
  type VNodeChild,
  type VNodePropValue,
} from "./vnode.ts";

function isPlainProps(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function describeValue(value: unknown): string {
  if (value === null) {
    return "null";
  }
  if (Array.isArray(value)) {
    return "array";
  }
  return typeof value;
}

function cloneVNode(vNode: VNode): VNode {
  if (vNode.type === TEXT_ELEMENT) {
    return createTextElement(vNode.props.nodeValue);
  }

  const props = Object.fromEntries(
    Object.entries(vNode.props).filter(([name]) => name !== "children"),
  );
  return createElement(vNode.type, props, ...vNode.props.children);
}

function copyStyle(value: unknown, property: string): VNodePropValue {
  if (value === null || value === undefined) {
    return value;
  }
  if (!isStyleObject(value)) {
    throw new TypeError(`The "${property}" prop must be a style object with string values.`);
  }

  for (const name of Object.keys(value)) {
    if (!isStylePropertyName(name)) {
      throw new TypeError(
        `Unsupported style property "${name}". Use camelCase CSS names or a --custom-property.`,
      );
    }
  }

  return Object.freeze(Object.fromEntries(Object.entries(value)));
}

function copyProp(property: string, value: unknown): VNodePropValue {
  if (property === "style") {
    return copyStyle(value, property);
  }

  if (/^on/i.test(property)) {
    if (property !== "onClick") {
      throw new TypeError(`Unsupported event prop "${property}". Only onClick is supported.`);
    }
    if (isMiniReactEventHandler(value)) {
      return value;
    }
    if (value === null || value === undefined) {
      return value;
    }
    throw new TypeError('The "onClick" prop must be a function.');
  }

  if (
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  throw new TypeError(`Unsupported value for prop "${property}": ${describeValue(value)}.`);
}

function normalizeProps(props: ElementProps, children: readonly VNode[]): NativeElementVNode["props"] {
  if (props !== null && !isPlainProps(props)) {
    throw new TypeError("createElement props must be a plain object or null.");
  }

  const entries: [string, VNodePropValue | readonly VNode[]][] = [];
  if (props !== null) {
    for (const [property, value] of Object.entries(props)) {
      if (property === "children") {
        continue;
      }
      entries.push([property, copyProp(property, value)]);
    }
  }

  entries.push(["children", children]);
  return Object.freeze(Object.fromEntries(entries)) as NativeElementVNode["props"];
}

function normalizeChildren(children: readonly VNodeChild[]): readonly VNode[] {
  const normalized: VNode[] = [];
  const activeArrays = new WeakSet<object>();

  const visit = (child: unknown, path: string): void => {
    if (child === null || child === undefined || typeof child === "boolean") {
      return;
    }

    if (typeof child === "string" || typeof child === "number") {
      normalized.push(createTextElement(child));
      return;
    }

    if (Array.isArray(child)) {
      if (activeArrays.has(child)) {
        throw new TypeError(`Cyclic child array at ${path} is not supported.`);
      }
      activeArrays.add(child);
      for (let index = 0; index < child.length; index += 1) {
        if (!Object.hasOwn(child, index)) {
          continue;
        }
        visit(child[index], `${path}[${index}]`);
      }
      activeArrays.delete(child);
      return;
    }

    if (isVNode(child)) {
      normalized.push(cloneVNode(child));
      return;
    }

    throw new TypeError(
      `Invalid child at ${path}: expected a VNode, string, number, boolean, null, undefined, or nested array; received ${describeValue(child)}.`,
    );
  };

  for (let index = 0; index < children.length; index += 1) {
    visit(children[index], `children[${index}]`);
  }

  return Object.freeze(normalized);
}

export function createElement(
  type: NativeElementType,
  props: ElementProps,
  ...children: VNodeChild[]
): NativeElementVNode {
  if (!isNativeElementType(type)) {
    throw new TypeError(`Unsupported native HTML element type: ${describeValue(type)}.`);
  }

  const normalizedChildren = normalizeChildren(children);
  const normalizedProps = normalizeProps(props, normalizedChildren);

  return Object.freeze({
    type,
    props: normalizedProps,
  });
}
