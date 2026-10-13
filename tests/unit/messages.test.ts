import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import fr from "../../messages/fr.json";

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ""): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((all, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "string"
      ? { ...all, [path]: value }
      : { ...all, ...flatten(value, path) };
  }, {});
}

/** {placeholders} and <tags> a translation must carry over unchanged. */
function tokens(message: string): string[] {
  return (message.match(/\{[a-zA-Z]+\}|<\/?[a-zA-Z]+>/g) ?? []).sort();
}

const english = flatten(en as Tree);
const french = flatten(fr as Tree);

describe("translations", () => {
  it("has exactly the same keys in English and French", () => {
    const missingInFrench = Object.keys(english).filter((key) => !(key in french));
    const missingInEnglish = Object.keys(french).filter((key) => !(key in english));
    expect(missingInFrench).toEqual([]);
    expect(missingInEnglish).toEqual([]);
  });

  it("has no empty strings", () => {
    const empty = [...Object.entries(english), ...Object.entries(french)]
      .filter(([, value]) => value.trim() === "")
      .map(([key]) => key);
    expect(empty).toEqual([]);
  });

  it("keeps the same placeholders and tags in both languages", () => {
    const mismatched = Object.keys(english).filter(
      (key) =>
        key in french &&
        JSON.stringify(tokens(english[key])) !== JSON.stringify(tokens(french[key])),
    );
    expect(mismatched).toEqual([]);
  });
});
