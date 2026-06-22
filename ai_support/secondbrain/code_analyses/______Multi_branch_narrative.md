# - [ ] Multi-branch narrative

```typescript
```typescript
import React from 'react';
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';

interface Branch {
  id: string;
  name: string;
  narrative: string;
}

const MultiBranchNarrative: React.FC = () => {
  const branchesRef = useRef<Branch[]>([]);
  const currentBranchIndexRef = useRef<number>(0);

  useEffect(() => {
    // Initialize branches
    branchesRef.current = [
      { id: '1', name: 'Path A', narrative: 'You chose path A' },
      { id: '2', name: 'Path B', narrative: 'You chose path B' },
      { id: '3', name: 'Path C', narrative: 'You chose path C' }
    ];
  }, []);

  const selectBranch = (index: number) => {
    if (index >= 0 && index < branchesRef.current.length) {
      currentBranchIndexRef.current = index;
    }
  };

  useFrame(() => {
    // Update narrative based on current branch
    const currentBranch = branchesRef.current[currentBranchIndexRef.current];
    console.log(currentBranch.narrative);
  });

  return (
    <div>
      {branchesRef.current.map((branch, index) => (
        <button key={branch.id} onClick={() => selectBranch(index)}>
          {branch.name}
        </button>
      ))}
    </div>
  );
};

export default MultiBranchNarrative;
```
```

Generated: 2026-06-22T12:03:04.659Z