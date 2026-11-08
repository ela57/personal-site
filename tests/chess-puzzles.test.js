import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Chess, validateFen } from "../vendor/chess.js";
import { puzzles } from "../lab/chess/puzzles.js";
import { normalizeProgress, updateProgress } from "../lab/chess/progress.js";

test("vendored runtime engine matches the pinned tooling engine", () => {
  assert.equal(
    readFileSync(new URL("../vendor/chess.js", import.meta.url), "utf8"),
    readFileSync(new URL("../node_modules/chess.js/dist/esm/chess.js", import.meta.url), "utf8")
  );
});

test("unique puzzles and at least four per difficulty", () => {
  assert.equal(puzzles.length, 12);
  assert.equal(new Set(puzzles.map(p => p.id)).size, puzzles.length);
  for (const level of ["Beginner", "Intermediate", "Advanced"]) {
    assert.ok(puzzles.filter(p => p.difficulty === level).length >= 4);
  }
});

function assertLegalPosition(chess) {
  const pieces = chess.board().flat().filter(Boolean);
  const waitingKing = pieces.find(piece => piece.type === "k" && piece.color !== chess.turn());
  assert.ok(!chess.isAttacked(waitingKing.square, chess.turn()), "The side not to move cannot already be in check");
  for (const color of ["w", "b"]) {
    assert.ok(pieces.filter(piece => piece.color === color).length <= 16);
    assert.ok(pieces.filter(piece => piece.color === color && piece.type === "p").length <= 8);
  }
}

function forcesMate(chess, plies, attacker) {
  if (chess.isCheckmate()) return chess.turn() !== attacker;
  if (plies <= 0 || chess.isDraw()) return false;
  const moves = chess.moves();
  const wins = move => {
    chess.move(move);
    const result = forcesMate(chess, plies - 1, attacker);
    chess.undo();
    return result;
  };
  return chess.turn() === attacker ? moves.some(wins) : moves.every(wins);
}

for (const puzzle of puzzles) {
  test(puzzle.id + ": legal position and side to move, legal line, stated mate against every defence", () => {
    assert.ok(validateFen(puzzle.fen).ok);
    const chess = new Chess(puzzle.fen), player = chess.turn();
    assertLegalPosition(chess);
    assert.ok(Number.isInteger(puzzle.mateIn) && puzzle.mateIn > 0);
    assert.equal(puzzle.solution.length, puzzle.mateIn * 2 - 1);
    puzzle.solution.forEach((san, i) => {
      assert.equal(chess.turn(), i % 2 ? (player === "w" ? "b" : "w") : player);
      assert.equal(chess.move(san, { strict: true }).san, san);
      assertLegalPosition(chess);
      if (i % 2 === 0 && i < puzzle.solution.length - 1) {
        for (const defence of chess.moves()) {
          chess.move(defence);
          assert.ok(forcesMate(chess, puzzle.solution.length - i - 2, player), `${san} ${defence} escapes the claimed mate`);
          chess.undo();
        }
      }
    });
    assert.ok(chess.isCheckmate());
    if (puzzle.mateIn > 1) assert.equal(forcesMate(new Chess(puzzle.fen), puzzle.mateIn * 2 - 3, player), false, "The mate should not be advertised as longer than necessary");
  });
}

test("position audit rejects an already-checked waiting king and a cooperative-only line", () => {
  assert.throws(() => assertLegalPosition(new Chess("7k/8/5N2/8/8/8/8/6KR w - - 0 1")));
  assert.throws(() => assertLegalPosition(new Chess("7k/4N1p1/8/8/8/8/8/6KR w - - 0 1")));
  const oldOpera = new Chess("4kb1r/p2r1ppp/4qn2/1B2p1B1/4P3/1Q6/PPP2PPP/2KR4 w k - 2 15");
  oldOpera.move("Bxd7+"); oldOpera.move("Qxd7");
  assert.equal(forcesMate(oldOpera, 3, "w"), false);
});
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
