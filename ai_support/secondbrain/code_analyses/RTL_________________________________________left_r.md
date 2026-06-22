# RTL-план на будущее: компоненты без жёстких left/right.

```typescript
```typescript
import React from 'react';
import { useSpring, animated } from '@react-spring/web';

interface PositionProps {
  x?: number;
  y?: number;
}

const AnimatedPosition: React.FC<PositionProps> = ({ x = 0, y = 0 }) => {
  const props = useSpring({ x, y });

  return (
    <animated.div style={props}>
      {children}
    </animated.div>
  );
};

export default AnimatedPosition;
```
```

Generated: 2026-06-22T12:15:57.274Z