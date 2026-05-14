/** DOM for CSS2DObject — diegetic dialogue / labels (Chronos palette). */

const BUBBLE_CLASS = 'chronos-spatial-bubble';

export function applyBubbleBaseStyles(root: HTMLElement): void {
  root.className = BUBBLE_CLASS;
  root.style.cssText = [
    'max-width:min(320px,42vw)',
    'padding:10px 12px',
    'border-radius:12px',
    'background:rgba(6,10,18,0.82)',
    'border:1px solid rgba(102,252,241,0.35)',
    'box-shadow:0 0 18px rgba(102,252,241,0.18),inset 0 1px 0 rgba(255,255,255,0.06)',
    'font-family:ui-sans-serif,system-ui,sans-serif',
    'color:#e2e8f0',
    'font-size:12px',
    'line-height:1.45',
    'pointer-events:none',
    'user-select:none',
    'backdrop-filter:blur(8px)',
    '-webkit-backdrop-filter:blur(8px)'
  ].join(';');
}

export function createNpcNameplate(name: string, title?: string): HTMLElement {
  const el = document.createElement('div');
  el.className = `${BUBBLE_CLASS} chronos-npc-nameplate`;
  el.style.cssText = [
    'padding:4px 10px',
    'border-radius:999px',
    'background:rgba(8,12,22,0.75)',
    'border:1px solid rgba(167,139,250,0.45)',
    'color:#f5f3ff',
    'font-size:10px',
    'font-weight:600',
    'letter-spacing:0.04em',
    'text-transform:uppercase',
    'pointer-events:none',
    'white-space:nowrap',
    'box-shadow:0 0 12px rgba(167,139,250,0.2)'
  ].join(';');
  el.textContent = title ? `${name} · ${title}` : name;
  return el;
}

export function createDialogueBubble(speakerName: string, text: string): HTMLElement {
  const root = document.createElement('div');
  applyBubbleBaseStyles(root);
  const head = document.createElement('div');
  head.className = 'chronos-spatial-bubble-name';
  head.style.cssText =
    'font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#a5f3fc;margin-bottom:6px;';
  head.textContent = speakerName;
  const body = document.createElement('div');
  body.className = 'chronos-spatial-bubble-body';
  body.style.cssText = 'font-size:12.5px;color:#f1f5f9;font-weight:400;';
  body.textContent = text;
  root.appendChild(head);
  root.appendChild(body);
  return root;
}

export function updateDialogueBubbleBody(root: HTMLElement, text: string): void {
  const body = root.querySelector('.chronos-spatial-bubble-body');
  if (body) body.textContent = text;
}
