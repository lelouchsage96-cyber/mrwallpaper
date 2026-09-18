import assert from "node:assert/strict";
import test from "node:test";
import { buildWallpaperSeoFields, normalizeTag } from "./wallpaper-seo.ts";

test("SEO title stays aligned with the visible wallpaper title", () => {
  const seo = buildWallpaperSeoFields({
    title: "Ascending Angel Statue Dark Wallpaper",
    description: "A monochrome angel statue against a dark background.",
    primaryKeyword: "ascending angel statue phone wallpaper",
  });
  assert.equal(seo.seoTitle, "Ascending Angel Statue Dark Wallpaper | Mr Wallpapers");
  assert.equal(seo.primaryKeyword, "ascending angel statue phone wallpaper");
});

test("SEO title adds a useful wallpaper descriptor when the H1 needs one", () => {
  const seo = buildWallpaperSeoFields({
    title: "Hebrews 13:8 Jesus Christ Quote",
    description: "A light Christian design featuring Hebrews 13:8 with praying hands artwork.",
    primaryKeyword: "Hebrews 13:8 Jesus Christ quote phone wallpaper",
  });
  assert.equal(seo.seoTitle, "Hebrews 13:8 Jesus Christ Quote Phone Wallpaper | Mr Wallpapers");
});

test("SEO title preserves apostrophes instead of producing It'S", () => {
  const seo = buildWallpaperSeoFields({
    title: "It's Never Luck It's Always God Wallpaper",
    description: "A motivational Christian wallpaper with dark green lettering on white.",
    primaryKeyword: "it's never luck it's always god phone wallpaper",
  });
  assert.equal(seo.seoTitle, "It's Never Luck It's Always God Wallpaper | Mr Wallpapers");
});

test("SEO descriptions never cut a sentence at the preferred length", () => {
  const description =
    "A rubber duck wearing sunglasses floats through a dark stormy ocean filled with sharp fins. The wallpaper includes a motivational quote about staying calm when things get tense.";
  const seo = buildWallpaperSeoFields({
    title: "Chill Bro Rubber Duck Ocean Wallpaper",
    description,
    primaryKeyword: "chill bro rubber duck ocean wallpaper",
  });
  assert.equal(
    seo.seoDescription,
    "A rubber duck wearing sunglasses floats through a dark stormy ocean filled with sharp fins.",
  );
});

test("a single complete description is preserved rather than cut mid-sentence", () => {
  const description =
    "A detailed vertical phone wallpaper showing a human skeleton anatomy model against a neutral gray background with raised hand, exposed ribs, and subtle red muscle markings.";
  const seo = buildWallpaperSeoFields({
    title: "Skeleton Anatomy Phone Wallpaper",
    description,
    primaryKeyword: "skeleton anatomy phone wallpaper",
  });
  assert.equal(seo.seoDescription, description);
});

test("tag limits preserve complete words", () => {
  assert.equal(normalizeTag("classical sculpture wallpaper with dramatic shadows"), "classical sculpture wallpaper with");
  assert.equal(normalizeTag("monochrome statue wallpaper"), "monochrome statue wallpaper");
});
