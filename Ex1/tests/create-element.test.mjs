import assert from "node:assert/strict";
import test from "node:test";

import { createElement } from "../src/create-element.ts";
import { createTextElement } from "../src/create-text-element.ts";
import { isVNode } from "../src/vnode-guards.ts";
import { TEXT_ELEMENT } from "../src/vnode.ts";

test("createElement accepts null props and normalizes nested children in order", () => {
  const vnode = createElement("main", null, "one", [2, ["three", false, null, undefined]], true);

  assert.equal(vnode.type, "main");
  assert.deepEqual(
    vnode.props.children.map((child) => child.props.nodeValue),
    ["one", "2", "three"],
  );
  assert.ok(vnode.props.children.every((child) => child.type === TEXT_ELEMENT));
});

test("variadic children override props.children without mutating caller input", () => {
  const propsChildren = ["props child", null];
  const childArray = ["first", ["second", false]];
  const inputStyle = { color: "navy", "--accent-color": "gold" };
  const props = { id: "demo", children: propsChildren, style: inputStyle };

  const vnode = createElement("section", props, childArray);

  assert.deepEqual(vnode.props.children.map((child) => child.props.nodeValue), ["first", "second"]);
  assert.deepEqual(propsChildren, ["props child", null]);
  assert.deepEqual(childArray, ["first", ["second", false]]);
  assert.deepEqual(inputStyle, { color: "navy", "--accent-color": "gold" });
  assert.equal(Object.isFrozen(props), false);
  assert.equal(Object.isFrozen(propsChildren), false);
  assert.equal(Object.isFrozen(childArray), false);
  assert.equal(Object.isFrozen(inputStyle), false);
  assert.notEqual(vnode.props, props);
  assert.notEqual(vnode.props.style, inputStyle);
  assert.ok(Object.isFrozen(vnode));
  assert.ok(Object.isFrozen(vnode.props));
  assert.ok(Object.isFrozen(vnode.props.children));
  assert.ok(Object.isFrozen(vnode.props.style));
});

test("createElement clones and freezes valid caller-created VNodes", () => {
  const inputVNode = {
    type: "span",
    props: {
      children: [createTextElement("kept")],
    },
  };

  const result = createElement("p", null, inputVNode);
  const copiedChild = result.props.children[0];

  assert.notEqual(copiedChild, inputVNode);
  assert.equal(copiedChild.props.children[0].props.nodeValue, "kept");
  assert.ok(Object.isFrozen(copiedChild));
  assert.ok(Object.isFrozen(copiedChild.props));
  assert.ok(Object.isFrozen(copiedChild.props.children));
  assert.equal(Object.isFrozen(inputVNode), false);
  assert.equal(Object.isFrozen(inputVNode.props), false);
  assert.equal(Object.isFrozen(inputVNode.props.children), false);
});

test("createElement rejects malformed objects, invalid element names, and cyclic arrays", () => {
  assert.throws(
    () => createElement("div", null, { type: "div", props: { children: ["not a VNode"] } }),
    /Invalid child at children\[0\].*received object/,
  );
  assert.throws(() => createElement("custom-widget", null), /Unsupported native HTML element type/);

  const cyclicChildren = [];
  cyclicChildren.push(cyclicChildren);
  assert.throws(() => createElement("div", null, cyclicChildren), /Cyclic child array/);
});

test("isVNode validates the complete tree and rejects cyclic or malformed data", () => {
  assert.equal(isVNode(createElement("article", null, "valid")), true);
  assert.equal(isVNode({ type: "article", props: { children: [{}] } }), false);

  const cyclicVNode = { type: "div", props: { children: [] } };
  cyclicVNode.props.children.push(cyclicVNode);
  assert.equal(isVNode(cyclicVNode), false);
});

test("createElement rejects unsupported style values without freezing the input", () => {
  const style = { width: 20 };
  assert.throws(() => createElement("div", { style }), /style object with string values/);
  assert.equal(Object.isFrozen(style), false);
});

test("createElement accepts only callable or nullish onClick and rejects unsupported event props", () => {
  for (const value of ["handler", 1, true, {}]) {
    assert.throws(
      () => createElement("button", { onClick: value }, "Click"),
      /The "onClick" prop must be a function\./,
    );
  }

  assert.throws(
    () => createElement("button", { onInput: null }, "Click"),
    /Unsupported event prop "onInput"/,
  );
});
