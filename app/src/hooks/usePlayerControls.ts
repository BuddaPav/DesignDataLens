/**
 * Player Controls Hook - First/Third Person Camera System
 * Provides keyboard/mouse input, camera mode toggle, pointer lock
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export type CameraMode = 'first' | 'third';

export interface PlayerControlsState {
  cameraMode: CameraMode;
  isPointerLocked: boolean;
  sensitivity: number;
  invertY: boolean;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
}

export interface PlayerControlsSettings {
  sensitivity?: number;
  invertY?: boolean;
  cameraMode?: CameraMode;
}

const DEFAULT_SETTINGS: PlayerControlsSettings = {
  sensitivity: 1.0,
  invertY: false,
  cameraMode: 'third'
};

export function usePlayerControls(initialSettings: PlayerControlsSettings = {}) {
  const settings = { ...DEFAULT_SETTINGS, ...initialSettings };

  const [cameraMode, setCameraMode] = useState<CameraMode>(settings.cameraMode || 'third');
  const [isPointerLocked, setIsPointerLocked] = useState(false);

  const sensitivityRef = useRef(settings.sensitivity || 1.0);
  const invertYRef = useRef(settings.invertY || false);

  const keysRef = useRef<Map<string, boolean>>(new Map());
  const mouseRef = useRef({ dx: 0, dy: 0 });
  const positionRef = useRef(new THREE.Vector3(0, 1.6, 0));
  const velocityRef = useRef(new THREE.Vector3());
  const eulerRef = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));

  // Keyboard handlers
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current.set(e.key.toLowerCase(), true);

      // Toggle camera mode with V key
      if (e.key.toLowerCase() === 'v') {
        setCameraMode(prev => prev === 'first' ? 'third' : 'first');
      }

      // Pointer lock on click or tab
      if (e.key === 'Tab') {
        e.preventDefault();
        if (!isPointerLocked) {
          document.body.requestPointerLock?.();
        }
      }

      // Prevent default for game keys
      if (['w', 'a', 's', 'd', ' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };

    const up = (e: KeyboardEvent) => {
      keysRef.current.set(e.key.toLowerCase(), false);
    };

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);

    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [isPointerLocked]);

  // Mouse handlers
  useEffect(() => {
    const onPointerLockChange = () => {
      setIsPointerLocked(document.pointerLockElement !== null);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement) {
        const sens = sensitivityRef.current;
        const inv = invertYRef.current ? -1 : 1;
        mouseRef.current.dx += e.movementX * sens * 0.002;
        mouseRef.current.dy += e.movementY * sens * 0.002 * inv;
      }
    };

    const onClick = () => {
      if (!isPointerLocked) {
        document.body.requestPointerLock?.();
      }
    };

    document.addEventListener('pointerlockchange', onPointerLockChange);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('click', onClick);

    return () => {
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('click', onClick);
    };
  }, [isPointerLocked]);

  // Get movement vector (normalized for diagonal)
  const getMovementVector = useCallback((): THREE.Vector3 => {
    const k = keysRef.current;
    const move = new THREE.Vector3();

    if (k.get('w') || k.get('arrowup')) move.z -= 1;
    if (k.get('s') || k.get('arrowdown')) move.z += 1;
    if (k.get('a') || k.get('arrowleft')) move.x -= 1;
    if (k.get('d') || k.get('arrowright')) move.x += 1;

    // Shift for sprint
    if (k.get('shift')) {
      move.multiplyScalar(2.0);
    }

    // Space for jump (simple gravity simulation)
    if (k.get(' ') && positionRef.current.y <= 1.6) {
      move.y = 1;
    }

    // Normalize diagonal movement
    if (move.length() > 0) {
      move.normalize();
    }

    return move;
  }, []);

  // Get rotation from mouse
  const getRotation = useCallback((): THREE.Euler => {
    const euler = eulerRef.current;
    const mouse = mouseRef.current;

    // Apply horizontal rotation (yaw)
    euler.y -= mouse.dx;

    // Apply vertical rotation (pitch), clamped
    euler.x -= mouse.dy;
    euler.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, euler.x));

    // Reset mouse delta after reading
    mouse.dx = 0;
    mouse.dy = 0;

    return euler;
  }, []);

  // Enable pointer lock
  const enablePointerLock = useCallback(() => {
    document.body.requestPointerLock?.();
  }, []);

  // Disable pointer lock
  const disablePointerLock = useCallback(() => {
    document.exitPointerLock?.();
  }, []);

  // Toggle camera mode
  const toggleCameraMode = useCallback(() => {
    setCameraMode(prev => prev === 'first' ? 'third' : 'first');
  }, []);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<PlayerControlsSettings>) => {
    if (newSettings.sensitivity !== undefined) {
      sensitivityRef.current = newSettings.sensitivity;
    }
    if (newSettings.invertY !== undefined) {
      invertYRef.current = newSettings.invertY;
    }
    if (newSettings.cameraMode !== undefined) {
      setCameraMode(newSettings.cameraMode);
    }
  }, []);

  return {
    // State
    cameraMode,
    isPointerLocked,
    sensitivity: sensitivityRef.current,
    invertY: invertYRef.current,

    // Position/velocity refs
    position: positionRef.current,
    velocity: velocityRef.current,
    euler: eulerRef.current,

    // Actions
    getMovementVector,
    getRotation,
    enablePointerLock,
    disablePointerLock,
    toggleCameraMode,
    updateSettings,

    // Constants
    MOVE_SPEED: 12, // тайлов/сек (increased from 9)
    SPRINT_MULTIPLIER: 1.8,
    MOUSE_SENSITIVITY: 0.002,
    TRANSITION_DURATION: 0.3 // seconds for camera lerp
  };
}