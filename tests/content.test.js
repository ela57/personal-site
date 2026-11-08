import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { projects } from "../content/projects.js";

const labels = new Set(["Working project integration", "Illustrative simulation", "Research prototype", "Proposed future feature"]);
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

function validate(entry) {
  for (const key of ["id", "title", "destination"]) assert.ok(typeof entry[key] === "string" && entry[key].trim());
  assert.ok(labels.has(entry.label));
  assert.equal(typeof entry.summary, "string");
  assert.equal(typeof entry.needsContent, "boolean");
  for (const key of ["body", "links", "assets", "dataSources"]) assert.ok(Array.isArray(entry[key]));
  if (entry.needsContent) {
    assert.equal(entry.label, "Proposed future feature");
    assert.equal(entry.summary, "");
    for (const key of ["body", "links", "assets", "dataSources"]) assert.deepEqual(entry[key], []);
  } else {
    assert.ok(entry.summary.trim() && entry.body.length && entry.dataSources.length);
    assert.ok(entry.body.every(fact => typeof fact === "string" && fact.trim()));
  }
}

test("destination model is sourced, uniquely keyed and explicitly classified", () => {
  assert.equal(new Set(projects.map(entry => entry.id)).size, projects.length);
  assert.equal(new Set(projects.map(entry => entry.destination)).size, projects.length);
  for (const entry of projects) {
    validate(entry);
    for (const path of entry.assets) assert.ok(existsSync(new URL(`../${path}`, import.meta.url)), path);
    for (const source of entry.dataSources) {
      assert.ok(source.repo && source.path);
      if (source.repo === "personal-site") assert.ok(existsSync(new URL(`../${source.path}`, import.meta.url)), source.path);
    }
    for (const link of entry.links) assert.ok(html.includes(`href="${link.href}"`), `Not an existing href: ${link.href}`);
  }
  assert.ok(!html.includes("content/projects.js"), "The model must not yet be wired into the page");
});

test("unsupported areas have title-only content, distinct from working chess puzzles", () => {
  assert.deepEqual(projects.filter(entry => entry.needsContent).map(entry => entry.id), ["data-universe", "malware-research", "scomp", "palletizer-fsm", "human-interaction", "chess-buddies"]);
  assert.equal(projects.find(entry => entry.id === "chess").needsContent, false);
});

test("model validation rejects invented placeholder prose, absent evidence and invalid labels", () => {
  const placeholder = projects.find(entry => entry.needsContent);
  assert.throws(() => validate({ ...placeholder, summary: "Unsupported capability" }));
  assert.throws(() => validate({ ...placeholder, label: "Production system" }));
  assert.throws(() => validate({ ...projects[0], dataSources: [] }));
});
