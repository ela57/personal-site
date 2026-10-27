import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Chess, validateFen } from "chess.js";
import { puzzles } from "../lab/chess/puzzles.js";
import { normalizeProgress, updateProgress } from "../lab/chess/progress.js";

test("vendored runtime engine matches the pinned tooling engine", () => {
  assert.equal(
    readFileSync(new URL("../vendor/chess.js", import.meta.url), "utf8"),
    readFileSync(new URL("../node_modules/chess.js/dist/esm/chess.js", import.meta.url), "utf8")
  );
});

test("unique puzzles and at least four per difficulty", () => {
  assert.equal(new Set(puzzles.map(p => p.id)).size, puzzles.length);
  for (const level of ["Beginner", "Intermediate", "Advanced"]) {
    assert.ok(puzzles.filter(p => p.difficulty === level).length >= 4);
  }
});
for (const puzzle of puzzles) {
  test(puzzle.id + ": valid FEN, legal alternating line, checkmate", () => {
    assert.ok(validateFen(puzzle.fen).ok);
    const chess = new Chess(puzzle.fen), player = chess.turn();
    assert.equal(puzzle.solution.length % 2, 1);
    puzzle.solution.forEach((san, i) => {
      assert.equal(chess.turn(), i % 2 ? (player === "w" ? "b" : "w") : player);
      assert.ok(chess.move(san));
    });
    assert.ok(chess.isCheckmate());
  });
}
test("progress: first solve, repeated solve, wrong move, reveal and invalid storage", () => {
  assert.deepEqual(normalizeProgress(null), { solved: [], streak: 0 });
  assert.deepEqual(normalizeProgress({ solved: ["a", "a", 3], streak: -1 }), { solved: ["a"], streak: 0 });
  const first = updateProgress(null, "solve", "a");
  assert.deepEqual(first, { solved: ["a"], streak: 1 });
  assert.deepEqual(updateProgress(first, "solve", "a"), first);
  assert.deepEqual(updateProgress(first, "wrong"), { solved: ["a"], streak: 0 });
  assert.deepEqual(updateProgress(first, "reveal"), { solved: ["a"], streak: 0 });
  assert.deepEqual(updateProgress(first, "solve", "b"), { solved: ["a", "b"], streak: 2 });
  assert.deepEqual(updateProgress(first, "solve", ""), first);
  assert.deepEqual(first, { solved: ["a"], streak: 1 });
});
