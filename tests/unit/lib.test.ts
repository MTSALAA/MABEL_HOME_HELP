import { describe, expect, it } from "vitest";
import { toCsv } from "@/lib/csv";
import { pick } from "@/lib/localize";
import { formatCad, parseDollarsToCents } from "@/lib/money";
import {
  formatPhone,
  isValidPhone,
  normalizePhone,
  smsHref,
  telHref,
} from "@/lib/phone";
import { emptyToNull, slugify } from "@/lib/utils";

describe("phone", () => {
  it("normalizes common North American formats to 10 digits", () => {
    expect(normalizePhone("(780) 555-0123")).toBe("7805550123");
    expect(normalizePhone("780.555.0123")).toBe("7805550123");
    expect(normalizePhone("+1 780 555 0123")).toBe("7805550123");
    expect(normalizePhone("1-780-555-0123")).toBe("7805550123");
  });

  it("rejects numbers that are not valid NANP numbers", () => {
    expect(normalizePhone("555-0123")).toBeNull();
    expect(normalizePhone("080 555 0123")).toBeNull(); // area code starts with 0
    expect(normalizePhone("780 155 0123")).toBeNull(); // exchange starts with 1
    expect(normalizePhone("2-780-555-0123")).toBeNull(); // wrong country code
    expect(isValidPhone("not a phone")).toBe(false);
  });

  it("formats for display and for links", () => {
    expect(formatPhone("7805550123")).toBe("(780) 555-0123");
    expect(telHref("(780) 555-0123")).toBe("tel:+17805550123");
    expect(smsHref("780-555-0123")).toBe("sms:+17805550123");
  });

  it("leaves unparseable input as typed rather than inventing a number", () => {
    expect(formatPhone("ext. 12")).toBe("ext. 12");
  });
});

describe("slugify", () => {
  it("builds URL-safe slugs", () => {
    expect(slugify("Snow Removal")).toBe("snow-removal");
    expect(slugify("Garbage & Recycling")).toBe("garbage-and-recycling");
    expect(slugify("  Épicerie et pharmacie!  ")).toBe("epicerie-et-pharmacie");
  });
});

describe("emptyToNull", () => {
  it("turns blank values into null and trims the rest", () => {
    expect(emptyToNull("   ")).toBeNull();
    expect(emptyToNull(undefined)).toBeNull();
    expect(emptyToNull("  hello ")).toBe("hello");
  });
});

describe("money", () => {
  it("formats CAD per locale", () => {
    expect(formatCad(20000, "en")).toBe("$200.00");
    // French Canadian uses a comma and puts the symbol after the amount.
    expect(formatCad(20000, "fr").replace(/\s/g, " ")).toBe("200,00 $");
  });

  it("parses dollar amounts typed by the owner", () => {
    expect(parseDollarsToCents("200")).toBe(20000);
    expect(parseDollarsToCents("$199.99")).toBe(19999);
    expect(parseDollarsToCents("199,5")).toBe(19950);
    expect(parseDollarsToCents("abc")).toBeNull();
    expect(parseDollarsToCents("10.999")).toBeNull();
  });
});

describe("pick (French with English fallback)", () => {
  it("uses French only when it has content", () => {
    expect(pick("fr", "Snow Removal", "Déneigement")).toBe("Déneigement");
    expect(pick("fr", "Quick Drop", null)).toBe("Quick Drop");
    expect(pick("fr", "Quick Drop", "   ")).toBe("Quick Drop");
    expect(pick("en", "Snow Removal", "Déneigement")).toBe("Snow Removal");
  });
});

describe("toCsv", () => {
  it("quotes cells containing commas, quotes and line breaks", () => {
    const csv = toCsv(["Name", "Note"], [["Doe, Jane", 'said "hi"\nbye']]);
    expect(csv).toContain('"Doe, Jane","said ""hi""\nbye"');
  });

  it("neutralises spreadsheet formulas typed into public forms", () => {
    const csv = toCsv(["Message"], [["=HYPERLINK(\"http://evil\")"], ["+1 780 555 0123"]]);
    expect(csv).toContain("\"'=HYPERLINK(\"\"http://evil\"\")\"");
    expect(csv).toContain("'+1 780 555 0123");
  });

  it("starts with a BOM and writes empty cells for missing values", () => {
    const csv = toCsv(["A", "B", "C"], [[null, undefined, 0]]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain(",,0");
  });
});
