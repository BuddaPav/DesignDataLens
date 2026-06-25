# Режим «без GPU» для WebLLM / Three (graceful degradation).

```typescript
```typescript
import { Scene, PerspectiveCamera, WebGLRenderer, TextureLoader } from 'three';
import { WebLLMBackend } from '@webllm/webllm-backend';

const scene = new Scene();
const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);

if (!renderer.getContext()) {
  // Fallback to software rendering if WebGL is not available
  console.warn('WebGL not supported. Falling back to software rendering.');
  renderer.forceContextCreation();
}

document.body.appendChild(renderer.domElement);

const backend = new WebLLMBackend();

// Example usage of the backend
backend.loadModel('path/to/model').then((model) => {
  // Use the model for rendering or other purposes
});

camera.position.z = 5;

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

animate();
```
```

Generated: 2026-06-22T06:26:29.746Z