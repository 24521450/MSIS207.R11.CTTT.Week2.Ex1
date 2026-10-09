import "./style.css";
import { mountDemo } from "./demo.ts";

const appRoot = document.querySelector<HTMLDivElement>("#app");

if (appRoot === null) {
  throw new Error('Required mount element "#app" was not found.');
}

mountDemo(appRoot);
