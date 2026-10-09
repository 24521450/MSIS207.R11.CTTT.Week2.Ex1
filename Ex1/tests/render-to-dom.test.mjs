import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import { createElement } from "../src/create-element.ts";
import { createTextElement } from "../src/create-text-element.ts";
import { setupEventDelegation } from "../src/event-delegation.ts";
import { renderToDOM } from "../src/render-to-dom.ts";
import { isVNode } from "../src/vnode-guards.ts";
import { FakeDocument, FakeElement, FakeEvent, FakeText } from "./fake-dom.mjs";

beforeEach(() => {
  globalThis.document = new FakeDocument();
});

test("renderToDOM recursively creates elements and text with supported props", () => {
  const vnode = createElement(
    "main",
    {
      className: "app-shell",
      id: "root-view",
      title: "Demo",
      role: "main",
      "aria-label": "Mini app",
      "aria-hidden": false,
      "data-ready": false,
      disabled: false,
      required: true,
      key: "internal-key",
      nodeValue: "not rendered",
      onClick: () => {},
      style: { backgroundColor: "#fff", "--space-unit": "12px" },
    },
    createElement("p", null, "Safe text"),
  );

  const dom = renderToDOM(vnode);

  assert.ok(dom instanceof FakeElement);
  assert.equal(dom.localName, "main");
  assert.equal(dom.getAttribute("class"), "app-shell");
  assert.equal(dom.getAttribute("id"), "root-view");
  assert.equal(dom.getAttribute("title"), "Demo");
  assert.equal(dom.getAttribute("role"), "main");
  assert.equal(dom.getAttribute("aria-label"), "Mini app");
  assert.equal(dom.getAttribute("aria-hidden"), "false");
  assert.equal(dom.getAttribute("data-ready"), "false");
  assert.equal(dom.getAttribute("disabled"), null);
  assert.equal(dom.getAttribute("required"), "");
  assert.equal(dom.getAttribute("key"), null);
  assert.equal(dom.getAttribute("nodevalue"), null);
  assert.equal(dom.getAttribute("onclick"), null);
  assert.equal(dom.style.values.get("background-color"), "#fff");
  assert.equal(dom.style.values.get("--space-unit"), "12px");
  assert.equal(dom.childNodes.length, 1);
  assert.equal(dom.childNodes[0].localName, "p");
  assert.equal(dom.textContent, "Safe text");
  assert.ok(dom.childNodes[0].childNodes[0] instanceof FakeText);
});

test("dangerous-looking strings stay in text nodes and do not create elements", () => {
  const scriptText = "<script>alert(1)</script>";
  const imageText = "<img src=x onerror=alert(1)>";
  const vnode = createElement("section", null, scriptText, imageText);

  const dom = renderToDOM(vnode);

  assert.equal(dom.textContent, scriptText + imageText);
  assert.ok(dom.childNodes.every((child) => child instanceof FakeText));
  assert.deepEqual(document.createdElements, ["section"]);
});

test("renderToDOM rejects malformed VNodes before creating DOM nodes", () => {
  assert.throws(
    () => renderToDOM({ type: "section", props: { children: [{}] } }),
    { name: "TypeError", message: "renderToDOM expects a valid native-element or text VNode." },
  );
  assert.deepEqual(document.createdElements, []);
});

test("factory-created buttons accept nullish onClick as absent through parent mounting", () => {
  for (const value of [null, undefined]) {
    const inputProps = { onClick: value };
    const buttonVNode = createElement("button", inputProps, "Click");

    assert.equal(isVNode(buttonVNode), true);
    assert.deepEqual(inputProps, { onClick: value });
    assert.equal(Object.isFrozen(inputProps), false);
    assert.equal(Object.isFrozen(buttonVNode), true);

    const directButton = renderToDOM(buttonVNode);
    assert.equal(directButton.localName, "button");
    assert.equal(directButton.textContent, "Click");
    assert.equal(directButton.getAttribute("onclick"), null);

    const parentVNode = createElement("div", null, buttonVNode);
    assert.equal(isVNode(parentVNode), true);
    const root = document.createElement("div");
    const cleanup = setupEventDelegation(root);
    root.replaceChildren(renderToDOM(parentVNode));

    const mountedButton = root.childNodes[0].childNodes[0];
    assert.equal(mountedButton.localName, "button");
    assert.equal(mountedButton.textContent, "Click");
    assert.equal(mountedButton.getAttribute("onclick"), null);
    assert.doesNotThrow(() => mountedButton.dispatchEvent(new FakeEvent("click")));
    cleanup();
  }
});

test("manually created VNodes accept nullish onClick without registering attributes or handlers", () => {
  for (const value of [null, undefined]) {
    const vnode = {
      type: "button",
      props: {
        onClick: value,
        children: [createTextElement("Manual")],
      },
    };

    assert.equal(isVNode(vnode), true);
    const button = renderToDOM(vnode);
    assert.equal(button.localName, "button");
    assert.equal(button.textContent, "Manual");
    assert.equal(button.getAttribute("onclick"), null);

    const root = document.createElement("div");
    const cleanup = setupEventDelegation(root);
    root.replaceChildren(button);
    assert.doesNotThrow(() => button.dispatchEvent(new FakeEvent("click")));
    cleanup();
  }
});

test("VNode validation rejects invalid onClick and unsupported event props", () => {
  for (const value of ["handler", 1, true, {}]) {
    const vnode = { type: "button", props: { onClick: value, children: [] } };
    assert.equal(isVNode(vnode), false);
    assert.throws(() => renderToDOM(vnode), /expects a valid native-element or text VNode/);
  }

  const unsupportedEventVNode = {
    type: "button",
    props: { onInput: null, children: [] },
  };
  assert.equal(isVNode(unsupportedEventVNode), false);
  assert.throws(
    () => renderToDOM(unsupportedEventVNode),
    /expects a valid native-element or text VNode/,
  );
});

test("root click delegation handles nested targets and is idempotent with cleanup", () => {
  const root = document.createElement("div");
  let pingCount = 0;
  const vnode = createElement(
    "button",
    { type: "button", onClick: () => { pingCount += 1; } },
    createElement("span", null, "Log Ping"),
  );
  const cleanup = setupEventDelegation(root);
  const sameCleanup = setupEventDelegation(root);

  root.replaceChildren(renderToDOM(vnode));
  const button = root.childNodes[0];
  const span = button.childNodes[0];

  assert.equal(cleanup, sameCleanup);
  assert.equal(root.listenerCount("click"), 1);
  assert.equal(button.listenerCount("click"), 0);
  assert.equal(span.listenerCount("click"), 0);
  span.dispatchEvent(new FakeEvent("click"));
  assert.equal(pingCount, 1);

  root.replaceChildren(renderToDOM(vnode));
  assert.equal(root.listenerCount("click"), 1);
  root.childNodes[0].childNodes[0].dispatchEvent(new FakeEvent("click"));
  assert.equal(pingCount, 2);

  cleanup();
  cleanup();
  assert.equal(root.listenerCount("click"), 0);
  root.childNodes[0].childNodes[0].dispatchEvent(new FakeEvent("click"));
  assert.equal(pingCount, 2);
});

test("delegation ignores non-element targets", () => {
  const root = document.createElement("div");
  let pingCount = 0;
  const cleanup = setupEventDelegation(root);
  const event = new FakeEvent("click");
  event.target = { nodeType: 3 };

  assert.doesNotThrow(() => root.listeners.get("click").values().next().value(event));
  assert.equal(pingCount, 0);
  cleanup();
});
