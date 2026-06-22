# - [ ] Multi-branch narrative

```typescript
```typescript
interface NarrativeNode {
  id: string;
  text: string;
  choices: Choice[];
}

interface Choice {
  text: string;
  nextNodeId: string;
}

class NarrativeManager {
  private nodes: { [id: string]: NarrativeNode } = {};

  addNode(node: NarrativeNode): void {
    this.nodes[node.id] = node;
  }

  startNarrative(startNodeId: string): void {
    const currentNode = this.getNode(startNodeId);
    if (!currentNode) {
      console.error(`Node with id ${startNodeId} not found.`);
      return;
    }
    this.displayNode(currentNode);
  }

  private displayNode(node: NarrativeNode): void {
    console.log(node.text);
    node.choices.forEach((choice, index) => {
      console.log(`${index + 1}. ${choice.text}`);
    });
  }

  makeChoice(choiceIndex: number): void {
    const currentNode = this.getCurrentNode();
    if (!currentNode) {
      console.error("No current node available.");
      return;
    }
    if (choiceIndex < 0 || choiceIndex >= currentNode.choices.length) {
      console.error("Invalid choice index.");
      return;
    }

    const nextNodeId = currentNode.choices[choiceIndex].nextNodeId;
    const nextNode = this.getNode(nextNodeId);
    if (!nextNode) {
      console.error(`Next node with id ${nextNodeId} not found.`);
      return;
    }
    this.displayNode(nextNode);
  }

  private getNode(id: string): NarrativeNode | undefined {
    return this.nodes[id];
  }

  private getCurrentNode(): NarrativeNode | undefined {
    // This is a simplified version. In a real game, you might need to store the current node's ID.
    return this.nodes['currentNodeId']; // Replace 'currentNodeId' with actual logic to get current node
  }
}

// Example usage:
const narrativeManager = new NarrativeManager();

const node1: NarrativeNode = {
  id: "node1",
  text: "You find yourself in a dark forest. What do you do?",
  choices: [
    { text: "Go left", nextNodeId: "node2" },
    { text: "Go right", nextNodeId: "node3" }
  ]
};

const node2: NarrativeNode = {
  id: "node2",
  text: "You encounter a friendly wizard. What do you say?",
  choices: [
    { text: "Ask for advice", nextNodeId: "node4" },
    { text: "Try to run away", nextNodeId: "node5" }
  ]
};

const node3: NarrativeNode = {
  id: "node3",
  text: "You stumble upon a hidden cave. What do you do?",
  choices: [
    { text: "Explore the cave", nextNodeId: "node6" },
    { text: "Leave the cave", nextNodeId: "node7" }
  ]
};

narrativeManager.addNode(node1);
narrativeManager.addNode(node2);
narrativeManager.addNode(node3);

narrativeManager.startNarrative("node1");
```
```

Generated: 2026-06-22T08:10:30.171Z