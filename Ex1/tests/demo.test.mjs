import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import { createDemoVNode, mountDemo } from "../src/demo.ts";
import { FakeDocument, FakeText } from "./fake-dom.mjs";

beforeEach(() => {
  globalThis.document = new FakeDocument();
});

function vnodeTree(vnode) {
  if (vnode.type === "TEXT_ELEMENT") {
    return { type: vnode.type, text: vnode.props.nodeValue };
  }
  return { type: vnode.type, children: vnode.props.children.map(vnodeTree) };
}

function domTree(node) {
  if (node instanceof FakeText) {
    return { type: "TEXT_ELEMENT", text: node.data };
  }
  return { type: node.localName, children: node.childNodes.map(domTree) };
}

function findElement(root, predicate) {
  if (predicate(root)) {
    return root;
  }
  for (const child of root.childNodes) {
    if (child.nodeType === 1) {
      const match = findElement(child, predicate);
      if (match !== null) {
        return match;
      }
    }
  }
  return null;
}

test("demo VNode tree mounts to matching semantic DOM and XSS strings stay text", () => {
  const vnode = createDemoVNode();
  const root = document.createElement("div");
  const cleanup = mountDemo(root);
  const mounted = root.childNodes[0];

  assert.deepEqual(domTree(mounted), vnodeTree(vnode));
  assert.equal(mounted.localName, "main");
  assert.ok(document.createdElements.includes("main"));
  assert.ok(document.createdElements.includes("header"));
  assert.ok(document.createdElements.includes("section"));
  assert.ok(document.createdElements.includes("h1"));
  assert.equal(document.createdElements.includes("script"), false);
  assert.equal(document.createdElements.includes("img"), false);
  assert.ok(mounted.textContent.includes("<script>alert(1)</script>"));
  assert.ok(mounted.textContent.includes("<img src=x onerror=alert(1)>"));
  cleanup();
});

test("demo remount replaces the tree and keeps one delegated listener", () => {
  const root = document.createElement("div");
  const originalConsoleLog = console.log;
  const logged = [];
  console.log = (value) => logged.push(value);

  let cleanup;
  try {
    cleanup = mountDemo(root);
    const oldTree = root.childNodes[0];
    const secondCleanup = mountDemo(root);
    const button = findElement(root.childNodes[0], (element) => element.localName === "button");
    const nestedText = findElement(button, (element) => element.localName === "span" && element.textContent === "Log Ping");

    assert.equal(cleanup, secondCleanup);
    assert.equal(root.childNodes.length, 1);
    assert.equal(oldTree.parentElement, null);
    assert.equal(root.listenerCount("click"), 1);
    assert.equal(button.listenerCount("click"), 0);
    assert.equal(nestedText.listenerCount("click"), 0);

    nestedText.dispatchEvent({
      type: "click",
      target: null,
      currentTarget: null,
      bubbles: true,
      defaultPrevented: false,
    });
    assert.deepEqual(logged, ["Ping"]);

    cleanup();
    assert.equal(root.listenerCount("click"), 0);
  } finally {
    cleanup?.();
    console.log = originalConsoleLog;
  }
});
