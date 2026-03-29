import "@lit-labs/ssr-dom-shim";
import { render } from "@lit-labs/ssr";

/**
 * Renders a Lit template to a string.
 * This is an SSR helper that consumes the Lit template iterable.
 */
export function renderToString(template) {
  const result = render(template);
  let html = "";
  for (const chunk of result) {
    html += chunk;
  }
  return html;
}
