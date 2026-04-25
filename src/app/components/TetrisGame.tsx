import { useState, useEffect, useCallback, useRef } from "react";

// Definição dos Tetrominós
const TETROMINOS = {
  I: { shape: [[1, 1, 1, 1]], color: "#00f5ff" },
  O: { shape: [[1, 1], [1, 1]], color: "#ffff00" },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: "#ff00ff" },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: "#00ff41" },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: "#ff0000" },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: "#0000ff" },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: "#ffa500" }
};

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

type TetrominoType = keyof typeof TETROMINOS;

interface Position {
  x: number;
  y: number;
}

interface Props {
  isPaused: boolean;
  onScoreChange: (score: number) => void;
  onLinesChange: (lines: number) => void;
  onGameOver: () => void;
  addPenaltyLine?: boolean;
  resetPenalty?: () => void;
  controls?: "arrows" | "wasd";
  borderColor?: string;
}

export function TetrisGame({
  isPaused,
  onScoreChange,
  onLinesChange,
  onGameOver,
  addPenaltyLine,
  resetPenalty,
  controls = "arrows",
  borderColor = "#00ff41"
}: Props) {
  const [board, setBoard] = useState<(string | null)[][]>(() =>
    Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null))
  );
  const [currentPiece, setCurrentPiece] = useState<{ type: TetrominoType; shape: number[][]; color: string } | null>(null);
  const [nextPiece, setNextPiece] = useState<{ type: TetrominoType; shape: number[][]; color: string } | null>(null);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const dropIntervalRef = useRef<number>(1000);
  const lastDropTime = useRef<number>(Date.now());

  // Gerar peça aleatória
  const generatePiece = useCallback(() => {
    const types = Object.keys(TETROMINOS) as TetrominoType[];
    const randomType = types[Math.floor(Math.random() * types.length)];
    const { shape, color } = TETROMINOS[randomType];
    return { type: randomType, shape: JSON.parse(JSON.stringify(shape)), color };
  }, []);

  // Inicializar jogo
  useEffect(() => {
    const piece = generatePiece();
    const next = generatePiece();
    setCurrentPiece(piece);
    setNextPiece(next);
    setPosition({ x: Math.floor(BOARD_WIDTH / 2) - Math.floor(piece.shape[0].length / 2), y: 0 });
  }, [generatePiece]);

  // Verificar colisão
  const checkCollision = useCallback((board: (string | null)[][], piece: number[][], pos: Position): boolean => {
    for (let y = 0; y < piece.length; y++) {
      for (let x = 0; x < piece[y].length; x++) {
        if (piece[y][x]) {
          const newY = pos.y + y;
          const newX = pos.x + x;

          if (newY >= BOARD_HEIGHT || newX < 0 || newX >= BOARD_WIDTH) {
            return true;
          }

          if (newY >= 0 && board[newY][newX]) {
            return true;
          }
        }
      }
    }
    return false;
  }, []);

  // Rotacionar peça
  const rotatePiece = useCallback((piece: number[][]): number[][] => {
    const rotated = piece[0].map((_, i) => piece.map(row => row[i]).reverse());
    return rotated;
  }, []);

  // Mover peça
  const movePiece = useCallback((dx: number, dy: number) => {
    if (!currentPiece || isPaused || gameOver) return;

    const newPos = { x: position.x + dx, y: position.y + dy };

    if (!checkCollision(board, currentPiece.shape, newPos)) {
      setPosition(newPos);
      return true;
    }
    return false;
  }, [currentPiece, position, board, isPaused, gameOver, checkCollision]);

  // Rotacionar
  const rotate = useCallback(() => {
    if (!currentPiece || isPaused || gameOver) return;

    const rotated = rotatePiece(currentPiece.shape);

    if (!checkCollision(board, rotated, position)) {
      setCurrentPiece({ ...currentPiece, shape: rotated });
    }
  }, [currentPiece, position, board, isPaused, gameOver, checkCollision, rotatePiece]);

  // Drop instantâneo
  const hardDrop = useCallback(() => {
    if (!currentPiece || isPaused || gameOver) return;

    let newPos = { ...position };
    while (!checkCollision(board, currentPiece.shape, { x: newPos.x, y: newPos.y + 1 })) {
      newPos.y += 1;
    }
    setPosition(newPos);
    lastDropTime.current = 0; // Forçar merge imediato
  }, [currentPiece, position, board, isPaused, gameOver, checkCollision]);

  // Merge peça no tabuleiro
  const mergePiece = useCallback(() => {
    if (!currentPiece) return;

    const newBoard = board.map(row => [...row]);

    for (let y = 0; y < currentPiece.shape.length; y++) {
      for (let x = 0; x < currentPiece.shape[y].length; x++) {
        if (currentPiece.shape[y][x]) {
          const boardY = position.y + y;
          const boardX = position.x + x;
          if (boardY >= 0) {
            newBoard[boardY][boardX] = currentPiece.color;
          }
        }
      }
    }

    // Verificar linhas completas
    let linesCleared = 0;
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (newBoard[y].every(cell => cell !== null)) {
        newBoard.splice(y, 1);
        newBoard.unshift(Array(BOARD_WIDTH).fill(null));
        linesCleared++;
        y++; // Verificar a mesma linha novamente
      }
    }

    if (linesCleared > 0) {
      const points = [0, 40, 100, 300, 1200][linesCleared];
      setScore(prev => prev + points);
      setLines(prev => prev + linesCleared);
    }

    setBoard(newBoard);

    // Nova peça
    if (nextPiece) {
      const startPos = {
        x: Math.floor(BOARD_WIDTH / 2) - Math.floor(nextPiece.shape[0].length / 2),
        y: 0
      };

      if (checkCollision(newBoard, nextPiece.shape, startPos)) {
        setGameOver(true);
        onGameOver();
      } else {
        setCurrentPiece(nextPiece);
        setNextPiece(generatePiece());
        setPosition(startPos);
      }
    }
  }, [currentPiece, position, board, nextPiece, generatePiece, checkCollision, onScoreChange, onLinesChange, onGameOver]);

  // Sincronizar score e lines com parent
  useEffect(() => {
    onScoreChange(score);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  useEffect(() => {
    onLinesChange(lines);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines]);

  // Adicionar linha de penalidade
  useEffect(() => {
    if (addPenaltyLine && resetPenalty) {
      setBoard(prev => {
        const newBoard = [...prev];
        newBoard.shift(); // Remove primeira linha
        const penaltyLine = Array(BOARD_WIDTH).fill(null).map((_, i) =>
          Math.random() > 0.3 ? "#666666" : null
        );
        newBoard.push(penaltyLine);
        return newBoard;
      });
      resetPenalty();
    }
  }, [addPenaltyLine, resetPenalty]);

  // Game loop
  useEffect(() => {
    if (isPaused || gameOver || !currentPiece) return;

    const gameLoop = () => {
      const now = Date.now();

      if (now - lastDropTime.current > dropIntervalRef.current) {
        if (!movePiece(0, 1)) {
          mergePiece();
        }
        lastDropTime.current = now;
      }
    };

    const interval = setInterval(gameLoop, 50);
    return () => clearInterval(interval);
  }, [isPaused, gameOver, currentPiece, movePiece, mergePiece]);

  // Controles de teclado
  useEffect(() => {
    if (isPaused || gameOver) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (controls === "arrows") {
        switch (e.key) {
          case "ArrowLeft":
            e.preventDefault();
            movePiece(-1, 0);
            break;
          case "ArrowRight":
            e.preventDefault();
            movePiece(1, 0);
            break;
          case "ArrowDown":
            e.preventDefault();
            movePiece(0, 1);
            break;
          case "ArrowUp":
            e.preventDefault();
            rotate();
            break;
          case " ":
            e.preventDefault();
            hardDrop();
            break;
        }
      } else if (controls === "wasd") {
        const key = e.key.toLowerCase();
        switch (key) {
          case "a":
            e.preventDefault();
            movePiece(-1, 0);
            break;
          case "d":
            e.preventDefault();
            movePiece(1, 0);
            break;
          case "s":
            e.preventDefault();
            movePiece(0, 1);
            break;
          case "w":
            e.preventDefault();
            rotate();
            break;
          case "q":
            e.preventDefault();
            hardDrop();
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPaused, gameOver, movePiece, rotate, hardDrop, controls]);

  // Renderizar tabuleiro
  const renderBoard = () => {
    const displayBoard = board.map(row => [...row]);

    // Adicionar peça atual
    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const boardY = position.y + y;
            const boardX = position.x + x;
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              displayBoard[boardY][boardX] = currentPiece.color;
            }
          }
        }
      }
    }

    return displayBoard;
  };

  const displayBoard = renderBoard();

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Tabuleiro */}
      <div
        className="bg-[#1a1a2e] border-4 p-2 rounded-lg"
        style={{
          borderColor: borderColor,
          boxShadow: `0 0 30px ${borderColor}80`
        }}
      >
        <div className="grid grid-cols-10 gap-[2px] bg-[#0a0a0f] p-2">
          {displayBoard.flat().map((cell, i) => (
            <div
              key={i}
              className="w-6 h-6 rounded-sm border border-[#2a2a3e] transition-all duration-100"
              style={{
                backgroundColor: cell || "#1a1a2e",
                boxShadow: cell ? `0 0 10px ${cell}` : "none"
              }}
            />
          ))}
        </div>
      </div>

      {/* Próxima Peça */}
      <div className="bg-[#1a1a2e] border-2 border-[#00f5ff] p-4 rounded-lg shadow-[0_0_20px_rgba(0,245,255,0.3)]">
        <h3 className="text-[#00f5ff] mb-3 tracking-wider uppercase text-center text-sm">Próxima Peça</h3>
        <div className="w-24 h-24 bg-[#0a0a0f] border border-[#2a2a3e] rounded flex items-center justify-center">
          {nextPiece && (
            <div className="grid gap-[2px]" style={{
              gridTemplateColumns: `repeat(${nextPiece.shape[0].length}, 1fr)`
            }}>
              {nextPiece.shape.flat().map((cell, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-sm"
                  style={{
                    backgroundColor: cell ? nextPiece.color : "transparent",
                    boxShadow: cell ? `0 0 8px ${nextPiece.color}` : "none"
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
