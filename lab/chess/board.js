import { Chess } from "../../vendor/chess.js";
import { puzzles } from "./puzzles.js";
import { normalizeProgress, updateProgress } from "./progress.js";

// Original geometric piece drawings, dedicated to the public domain (CC0).
const drawings = {
  p: '<circle cx="24" cy="14" r="6"/><path d="M21 20h6l3 15H18z"/>',
  r: '<path d="M14 8h5v6h4V8h4v6h4V8h5v12l-5 4 2 11H15l2-11-3-4z"/>',
  n: '<path d="m15 35 4-12-7 1 1-8L25 7l7 5 3 23z"/><path d="m15 18 9-5M25 9l-1-5" fill="none"/><circle cx="27" cy="16" r="1.5" class="pieceEye"/>',
  b: '<path d="M24 5c-13 10-10 17-3 20l-5 10h16l-5-10c7-3 10-10-3-20z"/><path d="m26 10-6 9" fill="none"/>',
  q: '<path d="m13 15 7 6 4-12 4 12 7-6-5 20H18z"/><circle cx="12" cy="12" r="3"/><circle cx="24" cy="7" r="3"/><circle cx="36" cy="12" r="3"/>',
  k: '<path d="M22 4h4v4h4v4h-4v4h-4v-4h-4V8h4zM17 18h14l3 7-6 10h-8l-6-10z"/><path d="M18 17h12" fill="none"/>'
};
const names = { p: "pawn", r: "rook", n: "knight", b: "bishop", q: "queen", k: "king" };
function pieceSVG(piece) {
  return `<svg viewBox="0 0 48 48" aria-hidden="true" class="chessPiece ${piece.color === "w" ? "pieceWhite" : "pieceBlack"}">${drawings[piece.type]}<path d="M13 36h22v5H13z"/></svg>`;
}

export function mountChess(root) {
  const controller = new AbortController(), opts = { signal: controller.signal };
  let progress;
  try { progress = normalizeProgress(JSON.parse(localStorage.getItem("notebook-chess"))); }
  catch { progress = normalizeProgress(null); }
  let level = "Beginner", puzzle, game, ply = 0, selected = null, hint = 0;
  let timer = 0, feedbackTimer = 0, busy = false, revealed = false, finished = false;
  let lastMove = null, drag = null, ghost = null, focusSquare = "a8";
  root.innerHTML = `<div class="chessLayout">
    <div class="chessBoardWrap"><div class="chessBoard" role="grid" aria-label="Chess puzzle board"></div>
    <p class="chessCaption mono"></p></div>
    <div class="chessPanel"><label class="mono" for="chessDifficulty">Difficulty</label>
      <select id="chessDifficulty"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select>
      <p class="chessNumber mono"></p><h3 class="chessTitle"></h3>
      <p class="chessStatus" role="status" aria-live="polite" aria-atomic="true"></p>
      <div class="chessControls"><button data-action="hint">Hint</button><button data-action="undo">Undo</button><button data-action="reset">Reset puzzle</button><button data-action="solution">Show solution</button><button data-action="next">Next puzzle →</button></div>
      <p class="chessProgress mono"></p><p class="chessExplanation"></p>
      <p class="chessHelp mono">Drag a piece, or select a piece and its destination. Arrow keys navigate; Enter or Space selects. Promotions follow the puzzle line, otherwise queen.</p>
    </div></div>`;
  const board = root.querySelector(".chessBoard"), status = root.querySelector(".chessStatus");
  const filtered = () => puzzles.filter(p => p.difficulty === level);
  const announce = text => { status.textContent = text; };
  const record = event => {
    progress = updateProgress(progress, event, puzzle.id);
    try { localStorage.setItem("notebook-chess", JSON.stringify(progress)); } catch { /* Storage is optional. */ }
    root.querySelector(".chessProgress").textContent = `Solved ${progress.solved.length} · Streak ${progress.streak}`;
  };
  const expected = () => { const copy = new Chess(game.fen()); return copy.move(puzzle.solution[ply]); };
  function cancel() {
    clearTimeout(timer); clearTimeout(feedbackTimer); timer = 0; busy = false;
    drag = null; ghost?.remove(); ghost = null;
    board.classList.remove("chessWrong");
  }
  function render() {
    const hadFocus = board.contains(document.activeElement);
    const black = puzzle.fen.split(" ")[1] === "b";
    const files = black ? "hgfedcba" : "abcdefgh", ranks = black ? "12345678" : "87654321";
    const legal = selected && !busy ? game.moves({ square: selected, verbose: true }).map(m => m.to) : [];
    const next = !finished && ply < puzzle.solution.length ? expected() : null;
    board.dataset.fen = game.fen();
    board.classList.toggle("chessSolved", finished && !revealed);
    board.replaceChildren();
    for (const rank of ranks) {
      const row = document.createElement("div"); row.setAttribute("role", "row");
      for (const file of files) {
        const square = file + rank, piece = game.get(square), cell = document.createElement("button");
        cell.type = "button"; cell.dataset.square = square; cell.setAttribute("role", "gridcell");
        cell.tabIndex = square === focusSquare ? 0 : -1;
        cell.className = "chessSquare " + ((file.charCodeAt(0) + Number(rank)) % 2 ? "chessLight" : "chessDark");
        cell.classList.toggle("selected", square === selected);
        cell.classList.toggle("legal", legal.includes(square));
        cell.classList.toggle("lastMove", !!lastMove && [lastMove.from, lastMove.to].includes(square));
        cell.classList.toggle("hint", !!next && ((hint >= 1 && square === next.from) || (hint >= 2 && square === next.to)));
        cell.classList.toggle("mateSquare", finished && square === lastMove?.to);
        cell.setAttribute("aria-label", `${square}${piece ? ` ${piece.color === "w" ? "White" : "Black"} ${names[piece.type]}` : " empty"}${legal.includes(square) ? ", legal destination" : ""}`);
        cell.setAttribute("aria-selected", String(square === selected));
        cell.innerHTML = (piece ? pieceSVG(piece) : "") + `<span class="chessCoord chessRank mono" aria-hidden="true">${file === files[0] ? rank : ""}</span><span class="chessCoord chessFile mono" aria-hidden="true">${rank === ranks[7] ? file : ""}</span>`;
        row.append(cell);
      }
      board.append(row);
    }
    if (hadFocus) board.querySelector(`[data-square="${focusSquare}"]`)?.focus({ preventScroll: true });
    root.querySelector('[data-action="undo"]').disabled = ply === 0;
    root.querySelector('[data-action="hint"]').disabled = finished || revealed || busy;
    root.querySelector('[data-action="solution"]').disabled = revealed;
    root.querySelector(".chessExplanation").textContent = finished ? puzzle.explanation : "";
  }
  function load(nextPuzzle = puzzle) {
    cancel(); puzzle = nextPuzzle; game = new Chess(puzzle.fen);
    ply = 0; selected = null; hint = 0; revealed = false; finished = false; lastMove = null;
    focusSquare = puzzle.fen.split(" ")[1] === "b" ? "h1" : "a8";
    root.querySelector(".chessTitle").textContent = puzzle.title;
    root.querySelector(".chessNumber").textContent = `Puzzle ${filtered().indexOf(puzzle) + 1} / ${filtered().length}`;
    root.querySelector(".chessCaption").textContent = `${game.turn() === "w" ? "White" : "Black"} to move · ${Math.ceil(puzzle.solution.length / 2)} move${puzzle.solution.length > 1 ? "s" : ""} to mate`;
    announce("Find the forcing line."); record("load"); render();
  }
  function complete() {
    finished = true; busy = false;
    if (!revealed) record("solve");
    announce(`${revealed ? "Solution shown" : "Solved"} · ${Math.ceil(ply / 2)} move${ply > 1 ? "s" : ""}. ${lastMove.san}`);
    render();
  }
  function playScript() {
    const move = game.move(puzzle.solution[ply++]); lastMove = move;
    announce(`${move.color === "w" ? "White" : "Black"}: ${move.san}`);
    if (ply === puzzle.solution.length) { complete(); return; }
    busy = revealed; render();
    if (revealed) timer = setTimeout(playScript, 650);
  }
  function wrong(text) {
    record("wrong"); announce(text); board.classList.remove("chessWrong");
    void board.offsetWidth; board.classList.add("chessWrong");
    clearTimeout(feedbackTimer); feedbackTimer = setTimeout(() => board.classList.remove("chessWrong"), 450);
  }
  function attempt(from, to) {
    if (busy || finished || revealed) return;
    const target = expected();
    let move;
    try { move = game.move({ from, to, promotion: target.promotion || "q" }); }
    catch { selected = null; render(); wrong("That move is not legal. Try again."); return; }
    const finalMate = ply === puzzle.solution.length - 1 && game.isCheckmate();
    if (move.san !== target.san && !finalMate) {
      game.undo(); selected = null; render(); wrong("Not the forcing line. Position restored; try again."); return;
    }
    ply++; lastMove = move; selected = null; hint = 0;
    announce(`${move.color === "w" ? "White" : "Black"}: ${move.san}`);
    if (ply === puzzle.solution.length) complete();
    else { busy = true; render(); timer = setTimeout(playScript, 400); }
  }
  function choose(square) {
    if (busy || finished || revealed) return;
    const piece = game.get(square);
    if (piece && piece.color === game.turn()) {
      selected = selected === square ? null : square; render();
    } else if (selected) attempt(selected, square);
  }
  board.addEventListener("pointerdown", e => {
    const cell = e.target.closest("[data-square]");
    if (!cell || e.button !== 0 || busy || finished || revealed) return;
    focusSquare = cell.dataset.square;
    const piece = game.get(focusSquare);
    drag = { square: focusSquare, x: e.clientX, y: e.clientY, moved: false, piece };
    board.setPointerCapture(e.pointerId);
  }, opts);
  board.addEventListener("pointermove", e => {
    if (!drag || !drag.piece || drag.piece.color !== game.turn()) return;
    if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6 && !drag.moved) return;
    if (!drag.moved) {
      drag.moved = true; selected = drag.square; render();
      ghost = document.createElement("div"); ghost.className = "chessGhost";
      ghost.innerHTML = pieceSVG(drag.piece); document.body.append(ghost);
    }
    ghost.style.transform = `translate(${e.clientX - 30}px, ${e.clientY - 30}px)`;
  }, opts);
  board.addEventListener("pointerup", e => {
    if (!drag) return;
    const previous = drag; drag = null; ghost?.remove(); ghost = null;
    if (board.hasPointerCapture(e.pointerId)) board.releasePointerCapture(e.pointerId);
    const cell = document.elementFromPoint(e.clientX, e.clientY)?.closest("[data-square]");
    if (cell && board.contains(cell)) {
      focusSquare = cell.dataset.square;
      if (previous.moved) attempt(previous.square, focusSquare);
      else choose(focusSquare);
    } else { selected = null; render(); }
  }, opts);
  board.addEventListener("pointercancel", () => { drag = null; ghost?.remove(); ghost = null; selected = null; render(); }, opts);
  board.addEventListener("keydown", e => {
    const cell = e.target.closest("[data-square]"); if (!cell) return;
    const cells = [...board.querySelectorAll("[data-square]")], i = cells.indexOf(cell);
    const offsets = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -8, ArrowDown: 8 };
    if (e.key in offsets) {
      e.preventDefault(); const next = Math.max(0, Math.min(63, i + offsets[e.key]));
      cell.tabIndex = -1; cells[next].tabIndex = 0; focusSquare = cells[next].dataset.square; cells[next].focus();
    } else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(cell.dataset.square); }
  }, opts);
  root.querySelector("select").addEventListener("change", e => { level = e.target.value; load(filtered()[0]); }, opts);
  root.addEventListener("click", e => {
    const action = e.target.closest("[data-action]")?.dataset.action;
    if (action === "reset") load();
    if (action === "next") { const group = filtered(); load(group[(group.indexOf(puzzle) + 1) % group.length]); }
    if (action === "hint" && !finished && !busy) {
      hint = Math.min(2, hint + 1); announce(hint === 1 ? `Look at ${expected().from}.` : `Try ${expected().from} to ${expected().to}.`); render();
    }
    if (action === "undo" && ply) {
      cancel(); const steps = ply % 2 ? 1 : 2;
      for (let i = 0; i < steps; i++) { game.undo(); ply--; }
      selected = null; hint = 0; finished = false; lastMove = game.history({ verbose: true }).at(-1) || null;
      if (revealed) { load(); return; }
      announce("One move pair undone."); render();
    }
    if (action === "solution") {
      load(); revealed = true; busy = true; record("reveal"); announce("Solution playback — not counted as solved."); render();
      timer = setTimeout(playScript, 400);
    }
  }, opts);
  load(filtered()[0]);
  return () => { cancel(); controller.abort(); root.replaceChildren(); };
}
