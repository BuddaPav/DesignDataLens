# AFK Game - Unity Project

## Overview
Unity project for AFK Game - enables asset creation, testing, and desktop builds.

## Requirements
- Unity Hub (installed)
- Unity Editor 2022.3 LTS

## Installation

### 1. Install Unity Editor
1. Open Unity Hub
2. Go to Installs
3. Click Add
4. Select Unity 2022.3 LTS
5. Wait for install

### 2. Open Project
1. Open Unity Hub
2. Go to Projects
3. Click Add
4. Navigate to this folder (unity/)
5. Click the project to open

## Project Structure
```
unity/
├── Assets/
│   ├── Scripts/       # C# game scripts
│   ├── Scenes/       # Unity scenes
│   └── Prefabs/      # Game prefabs
├── ProjectSettings/  # Unity config
└── Packages/        # Unity packages
```

## Scripts

### GameManager.cs
- Main game loop (world ticks)
- Game state management
- Pause/Resume

### PlayerSystem.cs
- Player state (health, gold, XP)
- Inventory management
- Level up system

### NPCManager.cs
- NPC spawning
- Dialog system
- NPC state updates

### QuestManager.cs
- Quest tracking
- Objectives
- Rewards

## Testing

### Run in Editor
1. Open Unity
2. Press Play
3. Game runs in editor

### Run Tests
1. Unity → Window → General → Test Runner
2. Run Edit Mode tests

## Build

### Desktop Build
1. File → Build Settings
2. Select platform (Windows/Mac/Linux)
3. Click Build

### Export Assets
1. Create 3D models in Unity
2. File → Export → FBX/OBJ
3. Copy to web project

## Web Integration
Exported assets can be used in the web (React/Three.js) project:
- Copy to `app/public/assets/unity/`
- Load via Three.js FBXLoader/OBJLoader