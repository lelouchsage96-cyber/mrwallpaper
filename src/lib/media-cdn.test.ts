import assert from "node:assert/strict";
import test from "node:test";
import { directR2PreviewUrl, resolveHero, resolvePreview, stablePreviewUrl } from "./media.ts";

const thumb = "https://cdn.mrwallpaper.org/thumbs/wallpaper-1a2b3c4d.jpg";
const preview = "https://cdn.mrwallpaper.org/previews/wallpaper-1a2b3c4d.jpg";

test("R2 thumbnails resolve to their version-matched preview on the image CDN", () => {
  assert.equal(directR2PreviewUrl(thumb), preview);
  assert.equal(resolveHero("wallpaper", thumb, "pretty-wallpaper-slug"), preview);
  assert.equal(stablePreviewUrl("wallpaper", thumb, "pretty-wallpaper-slug"), preview);
});

test("R2 preview URLs are returned directly, without a Vercel /media/ request", () => {
  assert.equal(directR2PreviewUrl(preview), preview);
  assert.equal(resolvePreview("wallpaper", preview, "pretty-wallpaper-slug"), preview);
});

test("Private and legacy paths retain the existing pretty media endpoint", () => {
  assert.equal(resolvePreview("wallpaper", "/api/media/wallpaper-prev-1a2b3c4d", "pretty-slug"), "/media/pretty-slug-preview.jpg");
  assert.equal(resolveHero("wallpaper", "/api/media/wallpaper-thumb-1a2b3c4d", "pretty-slug"), "/media/pretty-slug-preview.jpg");
  assert.equal(stablePreviewUrl("wallpaper", "/api/media/wallpaper-prev-1a2b3c4d", "pretty-slug"), null);
});

test("Non-R2 external image URLs are left untouched", () => {
  const external = "https://images.example.com/wallpapers/photo.jpg";
  assert.equal(directR2PreviewUrl(external), null);
  assert.equal(resolvePreview("wallpaper", external, "wallpaper"), external);
});
