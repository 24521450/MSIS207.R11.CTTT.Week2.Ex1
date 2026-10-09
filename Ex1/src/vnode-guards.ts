import {
  TEXT_ELEMENT,
  isNativeElementType,
  type MiniReactEventHandler,
  type StyleObject,
  type VNode,
} from "./vnode.ts";

type UnknownRecord = Record<PropertyKey, unknown>;

function isUnknownArray(value: unknown): value is readonly unknown[] {
  return Array.isArray(value);
}

function isPlainRecord(value: unknown): value is UnknownRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function isStylePropertyName(property: string): boolean {
  return /^--[A-Za-z0-9_-]+$/.test(property) || /^[A-Za-z][A-Za-z0-9]*$/.test(property);
}

export function isStyleObject(value: unknown): value is StyleObject {
  if (!isPlainRecord(value)) {
    return false;
  }

  return Reflect.ownKeys(value).every((property) => {
    return (
      typeof property === "string" &&
      isStylePropertyName(property) &&
      typeof value[property] === "string"
    );
  });
}

export function isMiniReactEventHandler(value: unknown): value is MiniReactEventHandler {
  return typeof value === "function";
}

function hasOnlyKeys(record: UnknownRecord, expected: readonly string[]): boolean {
  const keys = Reflect.ownKeys(record);
  return keys.length === expected.length && expected.every((key) => keys.includes(key));
}

function isScalarPropValue(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

function hasValidElementProps(props: UnknownRecord): boolean {
  if (!Object.hasOwn(props, "children") || !isUnknownArray(props.children)) {
    return false;
  }

  for (const property of Reflect.ownKeys(props)) {
    if (typeof property !== "string") {
      return false;
    }
    if (property === "children") {
      continue;
    }

    const value = props[property];
    if (property === "style") {
      if (value !== null && value !== undefined && !isStyleObject(value)) {
        return false;
      }
      continue;
    }

    if (/^on/i.test(property)) {
      if (
        property !== "onClick" ||
        (value !== null && value !== undefined && !isMiniReactEventHandler(value))
      ) {
        return false;
      }
      continue;
    }

    if (!isScalarPropValue(value)) {
      return false;
    }
  }

  return true;
}

function isVNodeInTree(value: unknown, ancestors: WeakSet<object>): value is VNode {
  if (!isPlainRecord(value) || ancestors.has(value)) {
    return false;
  }

  ancestors.add(value);
  try {
    if (!hasOnlyKeys(value, ["type", "props"])) {
      return false;
    }

    const props = value.props;
    if (!isPlainRecord(props)) {
      return false;
    }

    if (value.type === TEXT_ELEMENT) {
      return (
        hasOnlyKeys(props, ["nodeValue", "children"]) &&
        typeof props.nodeValue === "string" &&
        isUnknownArray(props.children) &&
        props.children.length === 0
      );
    }

    if (!isNativeElementType(value.type) || !hasValidElementProps(props)) {
      return false;
    }

    if (!isUnknownArray(props.children)) {
      return false;
    }
    const children = props.children;
    for (let index = 0; index < children.length; index += 1) {
      if (!Object.hasOwn(children, index) || !isVNodeInTree(children[index], ancestors)) {
        return false;
      }
    }

    return true;
  } finally {
    ancestors.delete(value);
  }
}

/** Safely verifies the complete POJO tree, returning false for malformed or cyclic input. */
export function isVNode(value: unknown): value is VNode {
  try {
    return isVNodeInTree(value, new WeakSet<object>());
  } catch {
    return false;
  }
}
