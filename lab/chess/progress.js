export function normalizeProgress(value) {
  return {
    solved: Array.isArray(value?.solved) ? [...new Set(value.solved.filter(id => typeof id === "string"))] : [],
    streak: Number.isSafeInteger(value?.streak) && value.streak >= 0 ? value.streak : 0
  };
}

export function updateProgress(value, event, id) {
  const state = normalizeProgress(value);
  if (event === "wrong" || event === "reveal") return { ...state, streak: 0 };
  if (event !== "solve" || typeof id !== "string" || !id || state.solved.includes(id)) return state;
  return { solved: [...state.solved, id], streak: state.streak + 1 };
}
