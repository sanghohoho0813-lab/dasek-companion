/**
 * 겹친 팝업(시트 위 확대 사진 등)의 닫힘 순서 — Esc·뒤로가기는 맨 위 하나만 닫는다.
 * 비원미래 useEscapeClose 의 스택 규칙을 그대로 따른다.
 */
const overlayStack: string[] = [];

export function pushOverlay(id: string) {
  overlayStack.push(id);
}

export function popOverlay(id: string) {
  const i = overlayStack.lastIndexOf(id);
  if (i >= 0) overlayStack.splice(i, 1);
}

export const isTopOverlay = (id: string) => overlayStack.length > 0 && overlayStack[overlayStack.length - 1] === id;

/** 테스트 전용 */
export const overlayDepth = () => overlayStack.length;
