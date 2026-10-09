# Project Rules — Mini-React Exercise 1

## Scope and workflow

- Implement only Exercise 1 from Slide 15 of `../Lab-02-Modern-React-Architecture-Virtual-DOM-State-Machines.md`.
- Work contract-first, then implement and verify one function or module at a time. Continue through the complete Exercise 1 workflow without waiting between tasks.
- Do not overwrite existing user work. Keep each implementation change inside its assigned task and preserve work outside Exercise 1.
- Do not add React or a third-party Virtual DOM library; the engine uses browser DOM APIs directly.
- Keep all Exercise 1 code, configuration, tests, and documentation in this folder. Do not extend the project to hooks, reconciliation, Fiber, or a backend.

## TypeScript and VNode contract

- Use ES modules, `const`/`let`, strict TypeScript, and no `any`.
- A VNode has `type` and `props`; `props.children` is a readonly array of VNodes. Native tags are the names in `src/vnode.ts`; SVG and function components are out of scope. Text uses `TEXT_ELEMENT` with a string `nodeValue` and no children.
- Factories must create new VNode objects, copy caller-owned props and children, normalize primitive text, flatten nested child arrays in order, and ignore null, undefined, and boolean children.
- Freeze the created VNode structure (VNode, props, and children array) so consumers cannot mutate it accidentally. Do not mutate or freeze caller-owned input objects.
- Validate VNodes and child objects from `unknown` with runtime type guards and clear errors.
- Style objects are limited to camelCase CSS property names (or custom properties beginning `--`) and CSS string values. No implicit units are inferred.

## DOM, attributes, and events

- Render text with `document.createTextNode`, HTML elements with `document.createElement`, and children recursively with `appendChild`.
- Mount the completed tree with `root.replaceChildren(renderToDOM(vApp))`.
- Map `className` to the `class` attribute; support regular HTML attributes, `id`, `title`, `role`, `aria-*`, and `data-*` safely.
- Never serialize `children`, `key`, or event-handler props as HTML attributes. Do not use `innerHTML`.
- Support `onClick` through an idempotent root-level event delegation setup with cleanup; do not use inline handlers or attach per-button listeners.
- Treat `aria-*` and `data-*` boolean values as the strings `"true"` or `"false"`. For native boolean attributes, `true` adds an empty attribute and `false` omits it.
- Use semantic tags (`main`, `header`, `section`, `h1`, `p`, `button`) and provide a visible keyboard focus style.
- Treat the required `<script>` and `<img>` strings as text. They must not create elements or execute code.

## Prohibited patterns and verification

- Do not use `var`, implicit globals, inline event handlers, `innerHTML`, `keypress`, or `keyCode`.
- Do not claim a check passed unless it was actually run. Record each executed check and its result in `TASK_DECOMPOSITION.md`.
- Keep the requested atomic commits for the completed `createElement` and `renderToDOM` milestones; do not create those commits before their implementation and checks are complete.
