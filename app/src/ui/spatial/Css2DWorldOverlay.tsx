/**
 * Синхронный CSS2DRenderer поверх WebGL — подписи и «пузыри» в мировых координатах.
 */
import { useThree, useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo } from 'react';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

export function Css2DWorldOverlay() {
  const { gl, scene, camera, size } = useThree();

  const labelRenderer = useMemo(() => new CSS2DRenderer(), []);

  useLayoutEffect(() => {
    const el = labelRenderer.domElement;
    el.style.position = 'absolute';
    el.style.top = '0';
    el.style.left = '0';
    el.style.pointerEvents = 'none';
    el.style.zIndex = '10';
    const parent = gl.domElement.parentElement;
    if (!parent) return;
    el.classList.add('chronos-css2d-host');
    parent.appendChild(el);
    return () => {
      if (el.parentElement) el.parentElement.removeChild(el);
      labelRenderer.domElement.replaceChildren();
    };
  }, [gl, labelRenderer]);

  useLayoutEffect(() => {
    labelRenderer.setSize(size.width, size.height);
  }, [labelRenderer, size]);

  useFrame(() => {
    labelRenderer.render(scene, camera);
  }, 1000);

  return null;
}
