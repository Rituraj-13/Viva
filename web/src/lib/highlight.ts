import "server-only";
import { codeToHtml } from "shiki";
import { shikiLanguage } from "./code";

export async function highlightCode(code: string, language: string) {
  return codeToHtml(code, {
    lang: shikiLanguage(language),
    theme: "github-light",
    transformers: [
      {
        line(node, line) {
          node.properties = {
            ...node.properties,
            "data-line": String(line),
          };
        },
      },
    ],
  });
}
