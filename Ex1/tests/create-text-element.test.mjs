import assert from "node:assert/strict";
import test from "node:test";

import { createTextElement } from "../src/create-text-element.ts";
import { TEXT_ELEMENT } from "../src/vnode.ts";

test("createTextElement normalizes strings and numbers to frozen text VNodes", () => {
  const stringNode = createTextElement("hello");
  const numberNode = createTextElement(42);

  assert.deepEqual(stringNode, {
    type: TEXT_ELEMENT,
    props: { nodeValue: "hello", children: [] },
  });
  assert.equal(numberNode.props.nodeValue, "42");
  assert.deepEqual(numberNode.props.children, []);
  assert.ok(Object.isFrozen(stringNode));
  assert.ok(Object.isFrozen(stringNode.props));
  assert.ok(Object.isFrozen(stringNode.props.children));
});

test("createTextElement rejects unsupported runtime values clearly", () => {
  assert.throws(
    () => createTextElement(true),
    { name: "TypeError", message: "createTextElement expects a string or number." },
  );
});
