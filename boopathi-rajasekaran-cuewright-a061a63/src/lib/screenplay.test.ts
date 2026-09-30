import assert from "node:assert/strict";
import test from "node:test";
import { createSample } from "./sample.ts";
import { renderScreenplayText, resolveLook, slugline } from "./screenplay.ts";

test("slugline follows scene heading order", () => {
  const project = createSample();
  assert.equal(
    slugline(project.scenes[0]),
    "INT. KOVIL STATION - ANNOUNCEMENT BOOTH - NIGHT",
  );
});

test("scene override replaces the bible look", () => {
  const project = createSample();
  const meera = project.characters[0];
  const platform = project.scenes[1].cast[0];
  const look = resolveLook(meera, platform);
  assert.equal(look.custom, true);
  assert.match(look.hairStyle, /pinned back/);
  assert.equal(look.dressColors.includes("#5c6b73"), true);
});

test("text export is fountain plus a scene kit", () => {
  const text = renderScreenplayText(createSample());
  assert.match(text, /^Title: Last Light at Kovil Station/);
  assert.match(text, /MEERA\n\(into the mic\)\nPlatform two/);
  assert.match(text, /CUEWRIGHT SCENE KIT/);
  assert.match(text, /Dress colors: #243e6b, #5c6b73, #8b1e3f/);
  assert.match(text, /Shooting location: Platform 2, night shoot/);
});
