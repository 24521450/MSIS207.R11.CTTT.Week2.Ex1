# Exercise 1 — Work Breakdown Structure

Work proceeds contract-first, one function or module at a time, with checks before moving to the next implementation step. Checkboxes and results reflect work actually completed.

## Task 1 — Initialize project and define contract

- [x] Read Slide 15 and related sections on VNodes, factories, recursive rendering, semantic HTML, security, and event delegation.
- [x] Inspect the workspace, current Exercise 1 files, Git state, and applicable `AGENTS.md` files.
- [x] Define strict TypeScript contracts for VNodes, props, styles, events, children, factories, and renderer.
- [x] Restrict element types to the native HTML tag list and document supported style and event scope.
- [x] Remove the previous stop-and-wait rule from `project-rules.md`.
- [x] Run `npm run typecheck` after the contract update — passed.

## Task 2 — Implement `createTextElement`

- [x] Normalize string and number input to a frozen `TEXT_ELEMENT` VNode with an empty frozen children array.
- [x] Add runtime rejection for unsupported values.
- [x] Run `npm test` — 2 tests passed, 0 failed.
- [x] Run `npm run typecheck` — passed.

## Task 3 — Implement `createElement`

- [x] Support null props, nested arrays, ignored null/undefined/boolean children, and preserved order.
- [x] Copy props and styles without mutating or freezing caller-owned objects; freeze copied VNodes, props, and children.
- [x] Reject malformed VNode children with clear errors; add recursive runtime `isVNode` validation.
- [x] Run `npm test` — 8 tests passed, 0 failed; run `npm run typecheck` — passed.
- [ ] Create `feat(core): implement createElement factory` — blocked because `git var GIT_AUTHOR_IDENT` and `git var GIT_COMMITTER_IDENT` report no configured name/email. No identity was invented and no commit was created.

## Task 4 — Implement `renderToDOM` and event delegation

- [x] Add recursive runtime VNode validation and clear errors for malformed or unsupported values.
- [x] Render text and native HTML recursively with DOM APIs; handle attributes, booleans, and supported styles.
- [x] Add idempotent root `click` delegation with cleanup; omit children, nodeValue, key, and handlers from attributes.
- [x] Run `npm test` after renderer work — 13 tests passed, 0 failed; run `npm run typecheck` — passed.
- [ ] Create `feat(core): implement renderToDOM` — blocked by the same missing Git author/committer identity; no identity was invented and no commit was created.

## Task 5 — Build the demo

- [x] Build semantic UI entirely from VNodes and mount into `#app` with `replaceChildren`.
- [x] Add the working button and both required XSS strings as text.
- [x] Add responsive CSS and a visible button focus state.
- [x] Document setup, structure, engine behavior, limits, and verification in `README.md`.

## Task 6 — Final verification

- [x] Run final TypeScript checking, tests, and production build; record actual commands and results in `README.md` — `npm test` (19 passed), `npm run typecheck` (passed), and `npm run build` (passed).
- [x] Inspect the running page and DOM; browser inspection showed one direct `main` child under `#app`. Automated DOM-double remount checks verified that replacement leaves one app tree and no extra children.
- [x] Verify the button, click on its nested span, keyboard activation, and root listener cleanup/idempotence — browser clicks on the nested mark and Enter/Space each logged `Ping`; DOM-double checks verified one root listener, no listeners on button/span, idempotent setup, and cleanup.
- [x] Verify XSS strings remain text with no generated `script` or `img` elements or execution — both exact strings were text nodes (`nodeType === 3`); browser inspection found no `script`/`img` descendants or JavaScript dialog.
- [ ] Verify the browser's actual listener inventory in DevTools — the available browser integration does not expose the DevTools listener panel or `getEventListeners()`. `README.md` contains a manual Elements/listener checklist; this check remains unverified.
- [x] Record the browser verification and its limitation in `README.md`.

## Task 7 — Fix optional `onClick` validation

- [x] Align VNode guard and renderer prop validation so only function, `null`, or `undefined` are valid `onClick` values; unsupported event props remain invalid.
- [x] Confirm `applyAttribute` skips nullish `onClick` values and registers only function callbacks.
- [x] Add regression tests for factory-created and manual VNodes with both nullish values, parent mounting, absent attributes/handlers, invalid event values, and factory input immutability.
- [x] Run `npm test` — 19 passed, 0 failed; `npm run typecheck` — passed; `npm run build` — passed.
- [x] Recheck the running demo in the browser — it mounted, and click, Enter, and Space each logged `Ping`.
