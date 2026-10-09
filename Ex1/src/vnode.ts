/** Reserved discriminator for text nodes. */
export const TEXT_ELEMENT = "TEXT_ELEMENT" as const;

/** Native HTML element types supported by this small engine (SVG and components are out of scope). */
export const NATIVE_ELEMENT_TYPES = Object.freeze([
  "a",
  "abbr",
  "address",
  "area",
  "article",
  "aside",
  "audio",
  "b",
  "base",
  "bdi",
  "bdo",
  "blockquote",
  "body",
  "br",
  "button",
  "canvas",
  "caption",
  "cite",
  "code",
  "col",
  "colgroup",
  "data",
  "datalist",
  "dd",
  "del",
  "details",
  "dfn",
  "dialog",
  "div",
  "dl",
  "dt",
  "em",
  "embed",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "head",
  "header",
  "hgroup",
  "hr",
  "html",
  "i",
  "iframe",
  "img",
  "input",
  "ins",
  "kbd",
  "label",
  "legend",
  "li",
  "link",
  "main",
  "map",
  "mark",
  "menu",
  "meta",
  "meter",
  "nav",
  "noscript",
  "object",
  "ol",
  "optgroup",
  "option",
  "output",
  "p",
  "param",
  "picture",
  "pre",
  "progress",
  "q",
  "rp",
  "rt",
  "ruby",
  "s",
  "samp",
  "script",
  "search",
  "section",
  "select",
  "slot",
  "small",
  "source",
  "span",
  "strong",
  "style",
  "sub",
  "summary",
  "sup",
  "table",
  "tbody",
  "td",
  "template",
  "textarea",
  "tfoot",
  "th",
  "thead",
  "time",
  "title",
  "tr",
  "track",
  "u",
  "ul",
  "var",
  "video",
  "wbr",
] as const);

const nativeElementTypeSet: ReadonlySet<string> = new Set(NATIVE_ELEMENT_TYPES);

export type NativeElementType = (typeof NATIVE_ELEMENT_TYPES)[number];

export function isNativeElementType(value: unknown): value is NativeElementType {
  return typeof value === "string" && nativeElementTypeSet.has(value);
}

/** CSS property values must be explicit strings; the renderer never infers units. */
export type StyleObject = Readonly<Record<string, string>>;

/** Exercise 1 delegates click handlers from the mount root. */
export type MiniReactEventHandler = (event: Event) => void;

export type VNodePropValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | StyleObject
  | MiniReactEventHandler;

/** The factory validates these unknown properties and copies supported values. */
export type ElementProps = Readonly<Record<string, unknown>> | null;

/** Input children may be nested arrays; the factory normalizes them to VNodes. */
export type VNodeChild =
  | VNode
  | string
  | number
  | boolean
  | null
  | undefined
  | readonly VNodeChild[];

export type NativeElementVNodeProps = Readonly<
  Record<string, VNodePropValue | readonly VNode[]>
> & {
  readonly children: readonly VNode[];
};

export interface NativeElementVNode {
  readonly type: NativeElementType;
  readonly props: NativeElementVNodeProps;
}

export interface TextVNode {
  readonly type: typeof TEXT_ELEMENT;
  readonly props: Readonly<{
    nodeValue: string;
    children: readonly [];
  }>;
}

/** All VNode variants use the same { type, props } object shape. */
export type VNode = NativeElementVNode | TextVNode;

/** Runtime predicate contract used before accepting or rendering unknown data. */
export type VNodeTypeGuard = (value: unknown) => value is VNode;

export type CreateTextElement = (text: string | number) => TextVNode;
export type CreateElement = (
  type: NativeElementType,
  props: ElementProps,
  ...children: VNodeChild[]
) => NativeElementVNode;
export type RenderToDOM = (vNode: unknown) => Node;
