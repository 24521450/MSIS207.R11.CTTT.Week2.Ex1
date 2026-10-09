# Mini-React VNode & Mounting Engine

Exercise 1 from Slide 15. The project builds a small Virtual DOM representation and mounts it with browser DOM APIs; it does not use React or a third-party Virtual DOM library.

## Run the demo

From the repository root:

```sh
cd Ex1
npm install
npm run dev
```

## Checks

Run these commands from `Ex1/`:

```sh
npm test
npm run typecheck
npm run build
```

`npm test` uses Node's built-in test runner and TypeScript type stripping, so no test framework or DOM dependency is added. This test script requires a Node version with `--experimental-strip-types` (the verified environment uses Node 24.15.0).

## Structure

- `src/vnode.ts` — VNode and props contracts plus the supported native HTML tag list.
- `src/vnode-guards.ts` — runtime checks for VNodes, style objects, and style property names.
- `src/create-text-element.ts` — immutable text VNode factory.
- `src/create-element.ts` — props copying, nested-child flattening, normalization, and immutable VNode factory.
- `src/render-to-dom.ts` — runtime validation, safe attribute/style assignment, and recursive DOM mounting.
- `src/event-delegation.ts` — one idempotent root click listener, DOM-node-to-handler lookup, and cleanup.
- `src/demo.ts`, `src/main.ts`, `src/style.css` — semantic demo tree, `#app` mount, and responsive presentation.
- `tests/` — factory, renderer, event-delegation, and demo checks using a small test-only DOM double.

## VNode behavior

Every node has `{ type, props }`. Native HTML VNodes store their normalized child list in `props.children`. Text VNodes use `type: "TEXT_ELEMENT"`, string `props.nodeValue`, and an empty children list. The TypeScript fields are readonly, and factories freeze the VNode, its props, and child arrays at runtime.

`createElement` treats variadic children as authoritative. It flattens nested arrays in order, converts strings and numbers to text VNodes, and skips null, undefined, and boolean children. A child object must pass `isVNode`; accepted VNodes are cloned so caller-owned objects are never frozen by the factory. Input props are copied, `props.children` is replaced by the normalized variadic children, and style objects are copied and frozen without freezing the input style.

The supported native HTML tag names are listed in `src/vnode.ts`. SVG, custom elements, function components, reconciliation, state, hooks, and Fiber are out of scope.

## DOM attributes and styles

`renderToDOM` validates the complete unknown input tree before creating DOM nodes. Text uses `document.createTextNode`; native elements use `document.createElement`; children are mounted recursively with `appendChild`.

`className` maps to `class`. Regular attributes, `id`, `title`, `role`, `aria-*`, and `data-*` use `setAttribute`. Native boolean attributes write an empty attribute for `true` and are omitted for `false`; boolean `aria-*` and `data-*` values become the strings `"true"` and `"false"`. `children`, `nodeValue`, `key`, and event props are never serialized as attributes.

Style objects support camelCase CSS property names and custom properties beginning with `--`. Values must be CSS strings with explicit units where needed; numeric CSS values are rejected rather than assigned guessed units.

## Root event delegation

The demo uses `onClick`. Its contract accepts a function, `null`, or `undefined`; nullish values mean there is no handler. Any other `onClick` value is rejected. Event props other than `onClick` are unsupported and rejected even when their value is nullish. The renderer never serializes event props as attributes and registers a callback only when `onClick` is a function. `setupEventDelegation(root)` registers one click listener on the root and stores handlers in a `WeakMap` keyed by the element created for the VNode. A click on a nested span bubbles to the root and resolves the nearest VNode handler. Calling setup again for the same root returns the existing cleanup function; cleanup removes the root listener. The application does not attach click listeners to buttons or spans.

## XSS handling

The demo passes `<script>alert(1)</script>` and `<img src=x onerror=alert(1)>` as string children. `createTextElement` converts each string to a `TEXT_ELEMENT`; `renderToDOM` creates text nodes with `document.createTextNode`. The browser therefore displays the characters without parsing script or image markup.

## Verification recorded

- `npm test` — 19 tests passed, 0 failed. Tests cover primitive normalization, null props, nested arrays, skipped children, order, caller-data immutability, frozen outputs, invalid children/VNodes, recursive DOM mounting, attributes, boolean attributes, styles, XSS text nodes, nested click delegation, idempotence, cleanup, remount replacement, and optional `onClick` regression cases.
- `npm run typecheck` — passed.
- `npm run build` — passed with Vite 8.3.4; production assets were generated in `dist/`.
- Browser check on `http://127.0.0.1:5173/` — the mount root had one direct `main`; the exact XSS strings were each in a text node (`nodeType === 3`); the subtree had zero `script` and `img` elements; no JavaScript dialog or console error/warning appeared.
- Browser interaction — clicking the nested button mark, pressing Enter, and pressing Space each logged `Ping`. Keyboard focus produced a 3px solid outline. At a 375px viewport the body width was 375px; at the default 1280px viewport it was 1280px, so neither checked layout overflowed horizontally.
- Automated DOM-double checks confirmed one root click listener, zero click listeners on the button and nested span, one listener after remount, and removal after cleanup.

The browser integration exposes DOM inspection and console logs but not the DevTools event-listener panel or `getEventListeners()`. Actual browser listener inventory is therefore **not verified**. In DevTools, inspect `#app` and confirm it contains one `main`; confirm the XSS strings are text and there are no `script`/`img` descendants; inspect the click listener on `#app` and compare its source with `src/event-delegation.ts`; confirm the button and its spans have no application click listeners; click the button and press Enter/Space to see `Ping`. A test remount can call `mountDemo(root)` twice, verify one `main` and one root click listener, then call the returned cleanup function and verify that listener is removed. Ignore listeners belonging to browser tooling or Vite outside the app root.
