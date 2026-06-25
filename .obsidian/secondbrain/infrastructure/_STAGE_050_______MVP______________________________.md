# [STAGE 050] Пост-MVP бэклог зафиксирован отдельно (PvP, сезоны, альтернативный движок — вне MVP).

```typescript
```typescript
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, Scene, Box, MeshStandardMaterial } from '@three-ts';

const GameScene: React.FC = () => {
  return (
    <Canvas>
      <PerspectiveCamera position={[5, 5, 5]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[1, 1, 1]} />
      <Scene>
        <Box args={[1, 1, 1]} material={new MeshStandardMaterial({ color: 'blue' })} />
      </Scene>
    </Canvas>
  );
};

export default GameScene;
```
```

Generated: 2026-06-22T11:42:17.689Z