import assert from "node:assert/strict";
import test from "node:test";
import { buildWallpaperSeoFields, normalizeTag } from "./wallpaper-seo.ts";

test("SEO title uses the primary keyword without repeating wallpaper", () => {
  const seo = buildWallpaperSeoFields({
    title: "Ascending Angel Statue Dark Wallpaper",
    description: "A monochrome angel statue against a dark background.",
    primaryKeyword: "ascending angel statue phone wallpaper",
  });
  assert.equal(seo.seoTitle, "Ascending Angel Statue Phone Wallpaper | Mr Wallpapers");
  assert.equal(seo.primaryKeyword, "ascending angel statue phone wallpaper");
});

test("tag limits preserve complete words", () => {
  assert.equal(normalizeTag("classical sculpture wallpaper with dramatic shadows"), "classical sculpture wallpaper with");
  assert.equal(normalizeTag("monochrome statue wallpaper"), "monochrome statue wallpaper");
});

