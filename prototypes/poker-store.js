export const pokerSelection = { hand: null, index: 0 };
export const pokerChanges = new EventTarget();
export function selectHand(hand,index=0) {
  pokerSelection.hand=Number(hand);pokerSelection.index=index;
  pokerChanges.dispatchEvent(new Event('change'));
}
