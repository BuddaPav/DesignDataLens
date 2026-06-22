# - [ ] Multi-branch narrative

```typescript
```typescript
import React, { useState } from 'react';

type NarrativeBranch = {
  id: string;
  title: string;
  content: string;
  nextBranches: string[];
};

const narratives: Record<string, NarrativeBranch> = {
  start: {
    id: 'start',
    title: 'The Beginning',
    content: 'You find yourself in a dark forest. What do you do?',
    nextBranches: ['path1', 'path2'],
  },
  path1: {
    id: 'path1',
    title: 'Path to the Castle',
    content: 'You follow a narrow path that leads to a castle. Do you enter?',
    nextBranches: ['castleEntrance'],
  },
  path2: {
    id: 'path2',
    title: 'Secret Cave',
    content: 'You stumble upon a hidden cave. What do you explore?',
    nextBranches: ['caveExploration'],
  },
  castleEntrance: {
    id: 'castleEntrance',
    title: 'Inside the Castle',
    content: 'You enter the castle and find a treasure chest. Do you open it?',
    nextBranches: ['treasureChest', 'leaveCastle'],
  },
  caveExploration: {
    id: 'caveExploration',
    title: 'Cave Exploration',
    content: 'You explore the cave and discover an old book. What do you do?',
    nextBranches: ['readBook', 'searchMore'],
  },
  treasureChest: {
    id: 'treasureChest',
    title: 'Treasure Chest',
    content: 'You open the chest and find gold coins. You are rich!',
    nextBranches: [],
  },
  leaveCastle: {
    id: 'leaveCastle',
    title: 'Leave Castle',
    content: 'You decide to leave the castle and continue your journey.',
    nextBranches: [],
  },
  readBook: {
    id: 'readBook',
    title: 'Read Book',
    content: 'You read the book and find out a secret about the forest. You feel enlightened!',
    nextBranches: [],
  },
  searchMore: {
    id: 'searchMore',
    title: 'Search More',
    content: 'You search more in the cave but find nothing of interest. It was just a dead end.',
    nextBranches: [],
  },
};

const MultiBranchNarrative: React.FC = () => {
  const [currentBranch, setCurrentBranch] = useState('start');

  const handleNextBranch = (branchId: string) => {
    setCurrentBranch(branchId);
  };

  const currentNarrative = narratives[currentBranch];

  return (
    <div>
      <h1>{currentNarrative.title}</h1>
      <p>{currentNarrative.content}</p>
      {currentNarrative.nextBranches.map((branchId) => (
        <button key={branchId} onClick={() => handleNextBranch(branchId)}>
          Go to {narratives[branchId].title}
        </button>
      ))}
    </div>
  );
};

export default MultiBranchNarrative;
```
```

Generated: 2026-06-22T06:11:55.228Z