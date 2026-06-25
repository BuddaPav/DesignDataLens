# - [ ] Cross-platform

```typescript
```typescript
// Нет конкретных деталей задачи, поэтому я предложю универсальный пример компонента, который может быть полезен в разных платформах.

import React from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';

const MovingCube: React.FC = () => {
  const [position, setPosition] = React.useState<Vector3>(new Vector3(0, 0, 0));

  useFrame(() => {
    setPosition((prevPosition) => prevPosition.add(new Vector3(0.1, 0, 0)));
  }, []);

  return (
    <mesh position={position}>
      <boxBufferGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="red" />
    </mesh>
  );
};

export default MovingCube;
```

Этот компонент создает куб, который движется вправо по оси X. Он может быть использован в разных платформах, так как не зависит от конкретных особенностей платформы.

После написания кода запустите `npm run build` для проверки корректности компиляции.
```

Generated: 2026-06-22T12:12:19.195Z