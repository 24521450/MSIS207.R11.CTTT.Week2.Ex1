import type { MiniReactEventHandler } from "./vnode.ts";

const clickHandlers = new WeakMap<Element, MiniReactEventHandler>();
const delegations = new WeakMap<HTMLElement, { readonly cleanup: () => void }>();

export function registerClickHandler(element: Element, handler: MiniReactEventHandler): void {
  clickHandlers.set(element, handler);
}

function isElementTarget(value: EventTarget | null, root: HTMLElement): value is Element {
  const ElementConstructor = root.ownerDocument.defaultView?.Element;
  return ElementConstructor !== undefined && value instanceof ElementConstructor;
}

/** Installs one click listener per root and returns an idempotent cleanup function. */
export function setupEventDelegation(root: HTMLElement): () => void {
  const existing = delegations.get(root);
  if (existing !== undefined) {
    return existing.cleanup;
  }

  const listener: EventListener = (event) => {
    if (!isElementTarget(event.target, root)) {
      return;
    }

    let current: Element | null = event.target;
    while (current !== null && root.contains(current)) {
      const handler = clickHandlers.get(current);
      if (handler !== undefined) {
        handler(event);
        return;
      }
      if (current === root) {
        return;
      }
      current = current.parentElement;
    }
  };

  root.addEventListener("click", listener);
  let active = true;
  const cleanup = (): void => {
    if (!active) {
      return;
    }
    active = false;
    root.removeEventListener("click", listener);
    delegations.delete(root);
  };

  delegations.set(root, { cleanup });
  return cleanup;
}
