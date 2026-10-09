import { createElement } from "./create-element.ts";
import { setupEventDelegation } from "./event-delegation.ts";
import { renderToDOM } from "./render-to-dom.ts";
import type { NativeElementVNode } from "./vnode.ts";

export function createDemoVNode(): NativeElementVNode {
  return createElement(
    "main",
    {
      className: "app-shell",
      "aria-labelledby": "page-title",
      "data-demo": "mini-react-vnode-engine",
    },
    createElement(
      "header",
      { className: "page-header" },
      createElement("p", { className: "eyebrow" }, "Exercise 1 · Virtual DOM"),
      createElement("h1", { id: "page-title" }, "Mini React Engine"),
      createElement(
        "p",
        { className: "intro" },
        "A small VNode tree mounted with browser DOM APIs.",
      ),
    ),
    createElement(
      "section",
      { className: "demo-section", "aria-labelledby": "demo-title" },
      createElement("h2", { id: "demo-title" }, "VNode mounting and safe text"),
      createElement(
        "p",
        null,
        "The examples below are passed to the engine as text children.",
      ),
      createElement("h3", null, "XSS test strings"),
      createElement(
        "pre",
        { className: "xss-samples" },
        createElement("code", null, "<script>alert(1)</script>"),
        createElement("br", null),
        createElement("code", null, "<img src=x onerror=alert(1)>"),
      ),
      createElement(
        "p",
        { className: "security-note", role: "note" },
        "Both strings are rendered with text nodes, so their markup is not parsed or executed.",
      ),
      createElement(
        "button",
        {
          type: "button",
          className: "ping-button",
          "aria-label": "Log Ping to the console",
          onClick: () => console.log("Ping"),
        },
        createElement("span", { className: "button-mark", "aria-hidden": true }, "↗"),
        createElement("span", null, "Log Ping"),
      ),
    ),
  );
}

export function mountDemo(root: HTMLElement): () => void {
  const vApp = createDemoVNode();
  const cleanup = setupEventDelegation(root);

  try {
    root.replaceChildren(renderToDOM(vApp));
  } catch (error) {
    cleanup();
    throw error;
  }

  return cleanup;
}
