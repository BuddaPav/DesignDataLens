import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import type { NPC } from '@/types/game';
import {
  createNpcNameplate,
  createDialogueBubble,
  updateDialogueBubbleBody
} from '@/ui/spatial/chronosBubbleDom';

export type NpcSpatialDialogue = { speakerName: string; text: string };

export function NpcCss2DLabels({
  npc,
  dialogueLine
}: {
  npc: NPC;
  dialogueLine?: NpcSpatialDialogue | null;
}) {
  const root = useRef<THREE.Group>(null);
  const bubbleObj = useRef<CSS2DObject | null>(null);
  const typeTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const g = root.current;
    if (!g) return;
    const nameEl = createNpcNameplate(npc.name, npc.title);
    const no = new CSS2DObject(nameEl);
    no.position.set(0, 1.82, 0);
    no.center.set(0.5, 1);
    g.add(no);

    const bubbleEl = createDialogueBubble(npc.name, ' ');
    bubbleEl.style.display = 'none';
    const bo = new CSS2DObject(bubbleEl);
    bo.position.set(0, 2.58, 0);
    bo.center.set(0.5, 1);
    g.add(bo);
    bubbleObj.current = bo;

    return () => {
      g.remove(no);
      g.remove(bo);
      bubbleObj.current = null;
      if (typeTimer.current) clearInterval(typeTimer.current);
    };
  }, [npc.id, npc.name, npc.title]);

  useEffect(() => {
    const bo = bubbleObj.current;
    if (!bo) return;
    const el = bo.element as HTMLElement;
    const head = el.querySelector('.chronos-spatial-bubble-name') as HTMLElement | null;
    if (typeTimer.current) {
      clearInterval(typeTimer.current);
      typeTimer.current = null;
    }
    if (!dialogueLine?.text?.trim()) {
      el.style.display = 'none';
      return;
    }
    el.style.display = '';
    if (head) head.textContent = dialogueLine.speakerName;
    const full = dialogueLine.text;
    let i = 0;
    updateDialogueBubbleBody(el, '');
    typeTimer.current = setInterval(() => {
      i += 1;
      updateDialogueBubbleBody(el, full.slice(0, i));
      if (i >= full.length && typeTimer.current) {
        clearInterval(typeTimer.current);
        typeTimer.current = null;
      }
    }, 16);
    return () => {
      if (typeTimer.current) clearInterval(typeTimer.current);
    };
  }, [dialogueLine?.text, dialogueLine?.speakerName]);

  return <group ref={root} />;
}
