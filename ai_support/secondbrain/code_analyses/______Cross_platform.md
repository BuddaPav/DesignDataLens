# - [ ] Cross-platform

```typescript
```typescript
import React, { createContext, useContext } from 'react';

// Тип для состояния игры
type GameState = {
  players: string[];
  currentPlayer: number;
  board: string[][];
  winner: string | null;
};

// Создаем контекст для управления состоянием игры
const GameContext = createContext<GameState>({
  players: [],
  currentPlayer: 0,
  board: Array(3).fill(null).map(() => Array(3).fill('')),
  winner: null,
});

// Приводит индекс ячейки в координаты на доске
const getCoordinates = (index: number): [number, number] => {
  const row = Math.floor(index / 3);
  const col = index % 3;
  return [row, col];
};

// Проверяет победителя по горизонтали, вертикали и диагоналям
const checkWinner = (board: string[][]): string | null => {
  for (let i = 0; i < 3; i++) {
    if (
      board[i][0] !== null &&
      board[i][0] === board[i][1] &&
      board[i][1] === board[i][2]
    ) {
      return board[i][0];
    }
    if (
      board[0][i] !== null &&
      board[0][i] === board[1][i] &&
      board[1][i] === board[2][i]
    ) {
      return board[0][i];
    }
  }

  if (board[0][0] !== null && board[0][0] === board[1][1] && board[1][1] === board[2][2]) {
    return board[0][0];
  }

  if (board[0][2] !== null && board[0][2] === board[1][1] && board[1][1] === board[2][0]) {
    return board[0][2];
  }

  return null;
};

// Компонент для отображения игрового поля
const TicTacToeBoard: React.FC = () => {
  const { board, currentPlayer, players, winner } = useContext(GameContext);

  const handleCellClick = (index: number) => {
    if (winner || board.flat().includes(null)) return;

    const [row, col] = getCoordinates(index);
    if (board[row][col]) return;

    board[row][col] = currentPlayer === 0 ? 'X' : 'O';

    const newWinner = checkWinner(board);

    if (newWinner) {
      alert(`${newWinner} wins!`);
    } else if (!board.flat().includes(null)) {
      alert('Draw!');
    }

    // Переключаем игрока
    setCurrentPlayer((prevPlayer) => (prevPlayer + 1) % players.length);
  };

  return (
    <div style={{ display: 'grid', gridTemplateRows: 'repeat(3, 50px)', gridTemplateColumns: 'repeat(3, 50px)' }}>
      {board.flat().map((cell, index) => (
        <button key={index} onClick={() => handleCellClick(index)}>{cell}</button>
      ))}
    </div>
  );
};

// Компонент для настройки игры
const TicTacToeSetup: React.FC = () => {
  const [players, setPlayers] = React.useState<string[]>(['Player X', 'Player O']);
  const [currentPlayer, setCurrentPlayer] = React.useState<number>(0);

  return (
    <div>
      <h1>Tic Tac Toe</h1>
      <input
        type="text"
        placeholder="Player X"
        value={players[0]}
        onChange={(e) => setPlayers([e.target.value, players[1]])}
      />
      <input
        type="text"
        placeholder="Player O"
        value={players[1]}
        onChange={(e) => setPlayers([players[0], e.target.value])}
      />
      <button onClick={() => setCurrentPlayer((prevPlayer) => (prevPlayer + 1) % players.length)}>
        Switch Player
      </button>
    </div>
  );
};

// Объединяем настройку и игровое поле в один компонент
const TicTacToe: React.FC = () => {
  return (
    <GameContext.Provider value={{ players, currentPlayer, board: Array(3).fill(null).map(() => Array(3).fill('')), winner: null }}>
      <TicTacToeSetup />
      <hr />
      <TicTacToeBoard />
    </GameContext.Provider>
  );
};

export default TicTacToe;
```
```

Generated: 2026-06-22T06:20:24.699Z