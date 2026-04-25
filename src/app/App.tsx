import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { TetrisGame } from "./components/TetrisGame";

interface Question {
  question: string;
  answer: string;
  level: 1 | 2 | 3;
}

const questions: Question[] = [
  // NÍVEL 1 - Básico (printf, operações simples, variáveis)
  {
    question: 'Qual é a saída de: printf("%d", 5 + 3);',
    answer: "8",
    level: 1
  },
  {
    question: 'Qual é a saída de: printf("%d", 10 - 4);',
    answer: "6",
    level: 1
  },
  {
    question: 'Qual é a saída de: printf("%d", 3 * 4);',
    answer: "12",
    level: 1
  },
  {
    question: "Qual função usamos para imprimir na tela em C?",
    answer: "printf",
    level: 1
  },
  {
    question: "Qual tipo de dado armazena números inteiros em C?",
    answer: "int",
    level: 1
  },
  {
    question: 'Qual é a saída de: printf("%d", 7 + 7);',
    answer: "14",
    level: 1
  },
  {
    question: "Em C, qual símbolo indica o final de uma instrução?",
    answer: ";",
    level: 1
  },
  {
    question: 'Qual é a saída de: printf("%d", 20 - 8);',
    answer: "12",
    level: 1
  },
  {
    question: "Qual palavra inicia a função principal de um programa em C?",
    answer: "main",
    level: 1
  },
  {
    question: 'Qual é a saída de: printf("%d", 6 * 2);',
    answer: "12",
    level: 1
  },
  {
    question: 'Qual é a saída de: printf("%d", 15 / 3);',
    answer: "5",
    level: 1
  },
  {
    question: "Qual símbolo usamos para comentário de uma linha em C?",
    answer: "//",
    level: 1
  },

  // NÍVEL 2 - Intermediário (if, loops simples, precedência)
  {
    question: "Em C, qual palavra-chave usamos para criar uma condição?",
    answer: "if",
    level: 2
  },
  {
    question: "Qual é o resultado de: 2 + 2 * 3?",
    answer: "8",
    level: 2
  },
  {
    question: "Qual palavra-chave é usada para repetir código em C?",
    answer: "for",
    level: 2
  },
  {
    question: 'Se x = 5, qual é a saída de: printf("%d", x > 3);',
    answer: "1",
    level: 2
  },
  {
    question: "Qual palavra-chave usamos para loops enquanto uma condição for verdadeira?",
    answer: "while",
    level: 2
  },
  {
    question: "Qual é o resultado de: 10 % 3 em C?",
    answer: "1",
    level: 2
  },
  {
    question: 'Se x = 0, qual é a saída de: printf("%d", !x);',
    answer: "1",
    level: 2
  },
  {
    question: "Qual operador compara igualdade em C?",
    answer: "==",
    level: 2
  },
  {
    question: "Qual palavra-chave sai de um loop em C?",
    answer: "break",
    level: 2
  },

  // NÍVEL 3 - Avançado (lógica mais complexa, mas ainda clara)
  {
    question: 'Se x = 5, qual é a saída de: printf("%d", x++ + ++x);',
    answer: "12",
    level: 3
  },
  {
    question: "Qual é o resultado de: (5 > 3) && (2 < 1)?",
    answer: "0",
    level: 3
  },
  {
    question: "Qual operador usamos para obter o endereço de uma variável?",
    answer: "&",
    level: 3
  },
  {
    question: "Qual é o resultado de: 8 >> 2 em C?",
    answer: "2",
    level: 3
  },
  {
    question: "Qual palavra-chave define uma estrutura em C?",
    answer: "struct",
    level: 3
  },
  {
    question: 'Se x = 10, qual é a saída de: printf("%d", x += 5);',
    answer: "15",
    level: 3
  },
  {
    question: "Qual operador ternário representa if-else em C?",
    answer: "?",
    level: 3
  }
];

export default function App() {
  const [screen, setScreen] = useState<"menu" | "game" | "instructions">("menu");
  const [gameMode, setGameMode] = useState<"single" | "multiplayer">("single");
  const [showQuestion, setShowQuestion] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [buzzedPlayer, setBuzzedPlayer] = useState<1 | 2 | null>(null);
  const [scorePlayer1, setScorePlayer1] = useState(0);
  const [scorePlayer2, setScorePlayer2] = useState(0);
  const [linesPlayer1, setLinesPlayer1] = useState(0);
  const [linesPlayer2, setLinesPlayer2] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [addPenaltyP1, setAddPenaltyP1] = useState(false);
  const [addPenaltyP2, setAddPenaltyP2] = useState(false);
  const [questionActive, setQuestionActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(15);
  const questionTimerRef = useRef<number | null>(null);
  const answerTimeoutRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);

  // Limpar timeouts ao desmontar
  useEffect(() => {
    return () => {
      if (questionTimerRef.current) {
        clearInterval(questionTimerRef.current);
      }
      if (answerTimeoutRef.current) {
        clearTimeout(answerTimeoutRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  // Determinar nível da pergunta baseado nas linhas limpas
  const getQuestionLevel = useCallback((lines: number): 1 | 2 | 3 => {
    if (lines < 5) return 1;      // 0-4 linhas: Nível 1
    if (lines < 15) return 2;     // 5-14 linhas: Nível 2
    return 3;                      // 15+ linhas: Nível 3
  }, []);

  // Selecionar pergunta aleatória do nível apropriado
  const selectQuestionByLevel = useCallback((level: 1 | 2 | 3) => {
    const questionsOfLevel = questions.filter(q => q.level === level);

    // Se não houver perguntas do nível exato, usar nível anterior
    if (questionsOfLevel.length === 0) {
      const fallbackLevel = Math.max(1, level - 1) as 1 | 2 | 3;
      return questions.filter(q => q.level === fallbackLevel)[0] || questions[0];
    }

    return questionsOfLevel[Math.floor(Math.random() * questionsOfLevel.length)];
  }, []);

  // Iniciar nova pergunta
  const startNewQuestion = useCallback(() => {
    // Prevenir múltiplas perguntas
    if (questionActive || showQuestion) {
      return;
    }

    // Determinar nível baseado nas linhas do jogador 1 (ou média no multiplayer)
    let currentLines = linesPlayer1;
    if (gameMode === "multiplayer") {
      currentLines = Math.floor((linesPlayer1 + linesPlayer2) / 2);
    }

    const questionLevel = getQuestionLevel(currentLines);
    const randomQuestion = selectQuestionByLevel(questionLevel);

    setCurrentQuestion(randomQuestion);
    setShowQuestion(true);
    setQuestionActive(true);
    setFeedback(null);
    setUserAnswer("");
    setBuzzedPlayer(null);
    setTimeRemaining(15); // Resetar timer para 15 segundos
  }, [questionActive, showQuestion, linesPlayer1, linesPlayer2, gameMode, getQuestionLevel, selectQuestionByLevel]);

  // Timer de perguntas automáticas
  useEffect(() => {
    if (screen === "game" && !questionActive) {
      questionTimerRef.current = window.setInterval(() => {
        startNewQuestion();
      }, 20000); // A cada 20 segundos

      return () => {
        if (questionTimerRef.current) {
          clearInterval(questionTimerRef.current);
        }
      };
    }
  }, [screen, questionActive, startNewQuestion]);

  // Countdown timer para a pergunta
  useEffect(() => {
    if (showQuestion && !feedback && timeRemaining > 0) {
      countdownTimerRef.current = window.setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Tempo esgotado
            if (countdownTimerRef.current) {
              clearInterval(countdownTimerRef.current);
            }
            // Marcar como incorreta automaticamente
            setFeedback("incorrect");

            // Aplicar penalidades
            if (gameMode === "multiplayer" && buzzedPlayer) {
              if (buzzedPlayer === 1) {
                setScorePlayer1(p => Math.max(0, p - 50));
                setAddPenaltyP1(true);
              } else {
                setScorePlayer2(p => Math.max(0, p - 50));
                setAddPenaltyP2(true);
              }
            } else if (gameMode === "single") {
              setScorePlayer1(p => Math.max(0, p - 50));
              setAddPenaltyP1(true);
            }

            // Fechar pergunta após delay
            setTimeout(() => {
              setShowQuestion(false);
              setFeedback(null);
              setUserAnswer("");
              setBuzzedPlayer(null);
              setTimeRemaining(15);

              setTimeout(() => {
                setQuestionActive(false);
              }, 3000);
            }, 2000);

            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
        }
      };
    }
  }, [showQuestion, feedback, timeRemaining, gameMode, buzzedPlayer]);

  useEffect(() => {
    if (showQuestion && gameMode === "multiplayer" && buzzedPlayer === null && feedback === null) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "a" || e.key === "A") {
          e.preventDefault();
          e.stopPropagation();
          setBuzzedPlayer(1);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          e.stopPropagation();
          setBuzzedPlayer(2);
        }
      };

      window.addEventListener("keydown", handleKeyDown, { capture: true });
      return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
    }
  }, [showQuestion, gameMode, buzzedPlayer, feedback]);

  const handleAnswerSubmit = useCallback(() => {
    if (!currentQuestion || feedback !== null) return;

    // Parar o countdown timer
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    // Normalizar resposta do usuário e resposta correta
    const normalizeAnswer = (answer: string) => {
      return answer.toLowerCase().trim().replace(/\s+/g, '');
    };

    const userNormalized = normalizeAnswer(userAnswer);
    const correctNormalized = normalizeAnswer(currentQuestion.answer);

    const isCorrect = userNormalized === correctNormalized;
    setFeedback(isCorrect ? "correct" : "incorrect");

    // Atualizar pontuação e penalidades
    if (gameMode === "multiplayer" && buzzedPlayer) {
      if (isCorrect) {
        // Acerto: adicionar 100 pontos
        if (buzzedPlayer === 1) {
          setScorePlayer1(prev => prev + 100);
        } else {
          setScorePlayer2(prev => prev + 100);
        }
      } else {
        // Erro: perder 50 pontos e adicionar 1 linha de penalidade
        if (buzzedPlayer === 1) {
          setScorePlayer1(prev => Math.max(0, prev - 50));
          setAddPenaltyP1(true);
        } else {
          setScorePlayer2(prev => Math.max(0, prev - 50));
          setAddPenaltyP2(true);
        }
      }
    } else if (gameMode === "single") {
      if (isCorrect) {
        setScorePlayer1(prev => prev + 100);
      } else {
        setScorePlayer1(prev => Math.max(0, prev - 50));
        setAddPenaltyP1(true);
      }
    }

    // Limpar timeout anterior se existir
    if (answerTimeoutRef.current) {
      clearTimeout(answerTimeoutRef.current);
    }

    // Aguardar 2 segundos antes de fechar a pergunta
    answerTimeoutRef.current = window.setTimeout(() => {
      setShowQuestion(false);
      setFeedback(null);
      setUserAnswer("");
      setBuzzedPlayer(null);
      setTimeRemaining(15);

      // Aguardar mais 3 segundos antes de permitir nova pergunta
      answerTimeoutRef.current = window.setTimeout(() => {
        setQuestionActive(false);
      }, 3000);
    }, 2000);
  }, [currentQuestion, feedback, userAnswer, gameMode, buzzedPlayer]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !feedback) {
      handleAnswerSubmit();
    }
  }, [handleAnswerSubmit, feedback]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setUserAnswer(e.target.value);
  }, []);

  const handleInputBlur = useCallback(() => {
    // Recuperar foco se perdido (a menos que seja por feedback)
    if (showQuestion && !feedback && inputRef.current) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
    }
  }, [showQuestion, feedback]);

  // Manter foco no input quando a pergunta aparecer - usando ref para não re-renderizar
  const inputRef = useRef<HTMLInputElement>(null);

  // Garantir foco automático no input quando a pergunta aparecer
  useEffect(() => {
    if (showQuestion && !feedback) {
      // Múltiplas tentativas para garantir foco
      const timer1 = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);

      const timer2 = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 150);

      const timer3 = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 300);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [showQuestion, feedback]);

  // Manter foco no input durante contagem regressiva
  useEffect(() => {
    if (showQuestion && !feedback && inputRef.current) {
      const interval = setInterval(() => {
        if (inputRef.current && document.activeElement !== inputRef.current) {
          inputRef.current.focus();
        }
      }, 500);

      return () => clearInterval(interval);
    }
  }, [showQuestion, feedback]);

  // Buzz system para multiplayer
  useEffect(() => {
    if (showQuestion && gameMode === "multiplayer" && buzzedPlayer === null && feedback === null) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "a" || e.key === "A") {
          e.preventDefault();
          e.stopPropagation();
          setBuzzedPlayer(1);
          // Focar input após buzz
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.focus();
            }
          }, 100);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          e.stopPropagation();
          setBuzzedPlayer(2);
          // Focar input após buzz
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.focus();
            }
          }, 100);
        }
      };

      window.addEventListener("keydown", handleKeyDown, { capture: true });
      return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
    }
  }, [showQuestion, gameMode, buzzedPlayer, feedback]);

  // Criar overlay de pergunta usando useMemo para evitar re-renderizações
  const QuestionOverlay = useMemo(() => {
    if (!showQuestion || !currentQuestion) return null;

    const canAnswer = gameMode === "single" || buzzedPlayer !== null;

    return (
      <div
        className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[9999]"
        onClick={(e) => {
          e.stopPropagation();
          // Manter foco no input ao clicar no overlay
          if (inputRef.current && canAnswer && !feedback) {
            inputRef.current.focus();
          }
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={`bg-[#1a1a2e] border-4 rounded-lg p-8 max-w-2xl w-full mx-4 ${
          timeRemaining <= 5 && !feedback
            ? "border-[#ff0055] shadow-[0_0_50px_rgba(255,0,85,0.8)] animate-pulse"
            : "border-[#00f5ff] shadow-[0_0_50px_rgba(0,245,255,0.6)]"
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-3xl text-[#00f5ff] tracking-wider uppercase">
                Pergunta de C
              </h2>
              <div className={`px-3 py-1 rounded-lg border-2 ${
                currentQuestion.level === 1
                  ? "bg-[#00ff41]/20 border-[#00ff41] text-[#00ff41]"
                  : currentQuestion.level === 2
                    ? "bg-[#ff00ff]/20 border-[#ff00ff] text-[#ff00ff]"
                    : "bg-[#ff0055]/20 border-[#ff0055] text-[#ff0055]"
              }`}>
                <span className="text-sm font-mono tracking-wider uppercase">
                  Nível {currentQuestion.level}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`text-3xl font-mono tabular-nums ${
                timeRemaining <= 5 ? "text-[#ff0055] animate-pulse" : "text-[#00ff41]"
              }`}>
                {timeRemaining}s
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#00ff41] rounded-full animate-pulse"></div>
                <span className="text-[#00ff41] text-sm font-mono">Ativa</span>
              </div>
            </div>
          </div>

          {/* Barra de progresso do tempo */}
          <div className="mb-6 h-2 bg-[#0a0a0f] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ease-linear ${
                timeRemaining <= 5 ? "bg-[#ff0055]" : "bg-[#00ff41]"
              }`}
              style={{ width: `${(timeRemaining / 15) * 100}%` }}
            />
          </div>

          {gameMode === "multiplayer" && buzzedPlayer === null && (
            <div className="mb-6 p-4 bg-[#0a0a0f] border-2 border-[#ff00ff] rounded-lg animate-pulse shadow-[0_0_25px_rgba(255,0,255,0.5)]">
              <p className="text-center text-2xl text-[#ff00ff] tracking-wider uppercase mb-2">
                ⚡ Aperte para buzinar!
              </p>
              <div className="flex justify-around mt-3 text-sm font-mono">
                <span className="text-[#00ff41] px-4 py-2 bg-[#1a1a2e] rounded border border-[#00ff41]">Player 1: Tecla A</span>
                <span className="text-[#ff00ff] px-4 py-2 bg-[#1a1a2e] rounded border border-[#ff00ff]">Player 2: Seta ←</span>
              </div>
            </div>
          )}

          {gameMode === "multiplayer" && buzzedPlayer !== null && (
            <div className={`mb-6 p-4 bg-[#0a0a0f] border-2 rounded-lg animate-[fadeIn_0.3s_ease-in] ${
              buzzedPlayer === 1
                ? "border-[#00ff41] shadow-[0_0_30px_rgba(0,255,65,0.8)]"
                : "border-[#ff00ff] shadow-[0_0_30px_rgba(255,0,255,0.8)]"
            }`}>
              <p className="text-center text-2xl tracking-wider uppercase">
                <span className={buzzedPlayer === 1 ? "text-[#00ff41]" : "text-[#ff00ff]"}>
                  🎯 Player {buzzedPlayer} está respondendo
                </span>
              </p>
            </div>
          )}

          <p className={`text-xl text-white mb-8 text-center leading-relaxed ${
            timeRemaining <= 5 && !feedback ? "animate-pulse" : ""
          }`}>
            {currentQuestion.question}
          </p>

          {timeRemaining <= 5 && !feedback && (
            <div className="mb-4 p-3 bg-[#ff0055]/20 border-2 border-[#ff0055] rounded-lg animate-pulse">
              <p className="text-center text-[#ff0055] font-mono tracking-wider uppercase">
                ⚠️ Tempo acabando!
              </p>
            </div>
          )}

          <input
            ref={inputRef}
            type="text"
            value={userAnswer}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            onBlur={handleInputBlur}
            placeholder={
              feedback !== null
                ? ""
                : canAnswer
                  ? "Digite aqui e pressione Enter..."
                  : "Aguardando buzz..."
            }
            disabled={!canAnswer || feedback !== null}
            className="w-full bg-[#0a0a0f] border-2 border-[#2a2a3e] text-[#00f5ff] px-6 py-4 rounded-lg mb-6 focus:border-[#00f5ff] focus:outline-none text-lg font-mono disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(0,245,255,0.3)] focus:shadow-[0_0_25px_rgba(0,245,255,0.6)] transition-none"
            autoFocus
            autoComplete="off"
            spellCheck="false"
          />

          {feedback && (
            <div
              className={`text-center mb-4 p-6 rounded-lg border-4 animate-[fadeIn_0.3s_ease-in] ${
                feedback === "correct"
                  ? "bg-[#00ff41]/20 border-[#00ff41] shadow-[0_0_40px_rgba(0,255,65,0.8)]"
                  : "bg-[#ff00ff]/20 border-[#ff00ff] shadow-[0_0_40px_rgba(255,0,255,0.8)]"
              }`}
            >
              {gameMode === "multiplayer" && buzzedPlayer && (
                <div className="text-xl mb-3">
                  <span className={buzzedPlayer === 1 ? "text-[#00ff41]" : "text-[#ff00ff]"}>
                    Player {buzzedPlayer}
                  </span>
                </div>
              )}
              <div
                className={`text-4xl font-mono mb-3 tracking-wider ${
                  feedback === "correct" ? "text-[#00ff41]" : "text-[#ff00ff]"
                }`}
              >
                {feedback === "correct"
                  ? "✓ CORRETO!"
                  : timeRemaining === 0
                    ? "⏰ TEMPO ESGOTADO"
                    : "✗ RESPOSTA INCORRETA"}
              </div>
              <div className={`text-2xl mb-2 ${
                feedback === "correct" ? "text-[#00f5ff]" : "text-[#ff0055]"
              }`}>
                {feedback === "correct" ? "+100 pontos" : "-50 pontos"}
              </div>
              {feedback === "incorrect" && (
                <div className="space-y-3 mt-4">
                  <div className="text-xl text-white bg-[#0a0a0f] p-4 rounded-lg border-2 border-[#00f5ff]">
                    Resposta correta: <span className="text-[#00ff41] font-bold text-2xl">{currentQuestion.answer}</span>
                  </div>
                  <div className="text-sm text-[#ff00ff] font-mono">
                    ⚠ Penalidade: +1 linha extra no tabuleiro
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleAnswerSubmit}
            disabled={!userAnswer || feedback !== null || !canAnswer}
            className="w-full px-8 py-4 bg-[#1a1a2e] border-2 border-[#00ff41] text-[#00ff41] rounded-lg hover:bg-[#00ff41] hover:text-[#0a0a0f] transition-all duration-300 shadow-[0_0_20px_rgba(0,255,65,0.4)] hover:shadow-[0_0_40px_rgba(0,255,65,0.8)] tracking-[0.2em] uppercase disabled:opacity-50 disabled:cursor-not-allowed text-xl font-bold"
          >
            {feedback ? "⏳ Continuando..." : "✓ Confirmar Resposta"}
          </button>

          {!feedback && canAnswer && (
            <p className="text-center text-[#00f5ff] text-sm mt-3 font-mono animate-pulse">
              ⌨️ Digite sua resposta e pressione <span className="text-[#00ff41] font-bold">Enter</span> para confirmar
            </p>
          )}
          {!feedback && !canAnswer && gameMode === "multiplayer" && (
            <p className="text-center text-[#ff00ff] text-sm mt-3 font-mono animate-pulse">
              ⚡ Aguardando jogador buzinar...
            </p>
          )}
        </div>
      </div>
    );
  }, [showQuestion, currentQuestion, gameMode, buzzedPlayer, userAnswer, feedback, timeRemaining, handleInputChange, handleKeyPress, handleInputBlur, handleAnswerSubmit]);

  if (screen === "menu") {
    return (
      <div className="size-full flex items-center justify-center bg-[#0a0a0f] p-8 overflow-hidden">
        <div className="flex flex-col items-center gap-12 animate-[fadeIn_1s_ease-in]">
          {/* Título Principal */}
          <div className="flex flex-col items-center gap-4">
            <h1 className="text-8xl tracking-[0.3em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#00ff41] via-[#00f5ff] to-[#ff00ff] animate-pulse drop-shadow-[0_0_30px_rgba(0,255,65,0.8)]">
              Tectris
            </h1>
            <p className="text-2xl tracking-widest text-[#00f5ff] font-mono animate-[glow_2s_ease-in-out_infinite]">
              Aprenda C jogando
            </p>
          </div>

          {/* Grid de Decoração */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="w-full h-full" style={{
              backgroundImage: `linear-gradient(#00ff41 1px, transparent 1px), linear-gradient(90deg, #00ff41 1px, transparent 1px)`,
              backgroundSize: '50px 50px'
            }}></div>
          </div>

          {/* Círculos de Glow Decorativos */}
          <div className="absolute top-20 left-20 w-64 h-64 bg-[#00ff41] rounded-full blur-[100px] opacity-20 animate-[pulse_3s_ease-in-out_infinite]"></div>
          <div className="absolute bottom-20 right-20 w-64 h-64 bg-[#ff00ff] rounded-full blur-[100px] opacity-20 animate-[pulse_4s_ease-in-out_infinite]"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#00f5ff] rounded-full blur-[120px] opacity-10 animate-[pulse_5s_ease-in-out_infinite]"></div>

          {/* Botões do Menu */}
          <div className="flex flex-col gap-6 z-10">
            <button
              onClick={() => {
                setGameMode("single");
                setScreen("game");
              }}
              className="group px-16 py-5 bg-[#1a1a2e] border-2 border-[#00ff41] text-[#00ff41] rounded-lg hover:bg-[#00ff41] hover:text-[#0a0a0f] transition-all duration-300 shadow-[0_0_30px_rgba(0,255,65,0.6)] hover:shadow-[0_0_50px_rgba(0,255,65,1)] tracking-[0.2em] uppercase hover:scale-105 transform animate-[highlightPulse_2s_ease-in-out_infinite]"
            >
              <span className="text-2xl">Jogar</span>
            </button>

            <button
              onClick={() => {
                setGameMode("multiplayer");
                setScreen("game");
              }}
              className="group px-16 py-5 bg-[#1a1a2e] border-2 border-[#ff00ff] text-[#ff00ff] rounded-lg hover:bg-[#ff00ff] hover:text-[#0a0a0f] transition-all duration-300 shadow-[0_0_20px_rgba(255,0,255,0.4)] hover:shadow-[0_0_40px_rgba(255,0,255,0.8)] tracking-[0.2em] uppercase hover:scale-105 transform"
            >
              <span className="text-2xl">Multiplayer</span>
            </button>

            <button
              onClick={() => setScreen("instructions")}
              className="group px-16 py-5 bg-[#1a1a2e] border-2 border-[#00f5ff] text-[#00f5ff] rounded-lg hover:bg-[#00f5ff] hover:text-[#0a0a0f] transition-all duration-300 shadow-[0_0_20px_rgba(0,245,255,0.4)] hover:shadow-[0_0_40px_rgba(0,245,255,0.8)] tracking-[0.2em] uppercase hover:scale-105 transform"
            >
              <span className="text-2xl">Instruções</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "instructions") {
    return (
      <div className="size-full flex items-center justify-center bg-[#0a0a0f] p-8 overflow-auto">
        <div className="max-w-2xl bg-[#1a1a2e] border-2 border-[#00f5ff] p-8 rounded-lg shadow-[0_0_30px_rgba(0,245,255,0.5)] animate-[fadeIn_0.5s_ease-in]">
          <h2 className="text-4xl text-[#00f5ff] mb-6 tracking-wider uppercase text-center">Instruções</h2>

          <div className="space-y-6 text-[#00ff41] font-mono">
            <div>
              <h3 className="text-xl text-[#ff00ff] mb-3">Como Jogar</h3>
              <p className="text-[#717182] leading-relaxed">
                Organize os blocos que caem para formar linhas horizontais completas. Quando uma linha é completada, ela desaparece e você ganha pontos. A cada 20 segundos, o jogo pausa para uma pergunta de C - responda corretamente para ganhar pontos extras!
              </p>
            </div>

            <div>
              <h3 className="text-xl text-[#ff00ff] mb-3">Controles</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center bg-[#0a0a0f] p-3 rounded border border-[#2a2a3e]">
                  <span className="text-[#717182]">← →</span>
                  <span className="text-[#00f5ff]">Mover para esquerda/direita</span>
                </div>
                <div className="flex justify-between items-center bg-[#0a0a0f] p-3 rounded border border-[#2a2a3e]">
                  <span className="text-[#717182]">↑</span>
                  <span className="text-[#00f5ff]">Girar peça</span>
                </div>
                <div className="flex justify-between items-center bg-[#0a0a0f] p-3 rounded border border-[#2a2a3e]">
                  <span className="text-[#717182]">↓</span>
                  <span className="text-[#00f5ff]">Acelerar descida</span>
                </div>
                <div className="flex justify-between items-center bg-[#0a0a0f] p-3 rounded border border-[#2a2a3e]">
                  <span className="text-[#717182]">Space</span>
                  <span className="text-[#00f5ff]">Queda instantânea</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl text-[#ff00ff] mb-3">Pontuação</h3>
              <p className="text-[#717182] leading-relaxed">
                Quanto mais linhas você completar de uma vez, mais pontos ganha. O jogo fica mais rápido conforme você sobe de nível!
              </p>
            </div>

            <div>
              <h3 className="text-xl text-[#ff00ff] mb-3">Perguntas de C e Pontuação</h3>
              <p className="text-[#717182] leading-relaxed mb-3">
                Durante o jogo, perguntas de C aparecerão a cada 20 segundos. A dificuldade aumenta conforme você limpa mais linhas no jogo. Digite sua resposta e pressione Enter para confirmar.
              </p>
              <div className="space-y-2 mb-3">
                <div className="flex justify-between items-center bg-[#0a0a0f] p-3 rounded border border-[#00ff41]">
                  <span className="text-[#717182]">Resposta Correta</span>
                  <span className="text-[#00ff41]">+100 pontos</span>
                </div>
                <div className="flex justify-between items-center bg-[#0a0a0f] p-3 rounded border border-[#ff0055]">
                  <span className="text-[#717182]">Resposta Incorreta ou Tempo Esgotado</span>
                  <span className="text-[#ff0055]">-50 pontos + 1 linha</span>
                </div>
              </div>
              <div className="space-y-2 mb-3">
                <div className="bg-[#0a0a0f] p-3 rounded border border-[#00f5ff]">
                  <h4 className="text-[#00f5ff] font-mono text-sm mb-2 uppercase">📊 Progressão de Dificuldade</h4>
                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-[#00ff41]">Nível 1 (0-4 linhas):</span>
                      <span className="text-[#717182]">Básico</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#ff00ff]">Nível 2 (5-14 linhas):</span>
                      <span className="text-[#717182]">Intermediário</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#ff0055]">Nível 3 (15+ linhas):</span>
                      <span className="text-[#717182]">Avançado</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[#00f5ff] text-sm font-mono leading-relaxed">
                  ⏱️ Você tem 15 segundos para responder cada pergunta
                </p>
                <p className="text-[#00f5ff] text-sm font-mono leading-relaxed">
                  💡 Dica: Digite apenas o resultado numérico ou a palavra-chave (ex: "8", "if", "printf")
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl text-[#ff00ff] mb-3">Sistema de Buzz (Multiplayer)</h3>
              <p className="text-[#717182] leading-relaxed mb-2">
                No modo multiplayer, quando uma pergunta aparece, os jogadores devem buzinar para ganhar o direito de responder:
              </p>
              <div className="space-y-2">
                <div className="flex justify-between items-center bg-[#0a0a0f] p-3 rounded border border-[#2a2a3e]">
                  <span className="text-[#717182]">Player 1 (WASD)</span>
                  <span className="text-[#00ff41]">Tecla A para Buzz</span>
                </div>
                <div className="flex justify-between items-center bg-[#0a0a0f] p-3 rounded border border-[#2a2a3e]">
                  <span className="text-[#717182]">Player 2 (Setas)</span>
                  <span className="text-[#ff00ff]">Seta ← para Buzz</span>
                </div>
              </div>
              <p className="text-[#717182] leading-relaxed mt-2">
                O primeiro a apertar ganha o direito de responder, enquanto o outro jogador é bloqueado! Durante o jogo, Player 1 usa WASD+Q e Player 2 usa as setas+Space.
              </p>
            </div>
          </div>

          <button
            onClick={() => setScreen("menu")}
            className="mt-8 w-full px-8 py-4 bg-[#1a1a2e] border-2 border-[#00ff41] text-[#00ff41] rounded-lg hover:bg-[#00ff41] hover:text-[#0a0a0f] transition-all duration-300 shadow-[0_0_20px_rgba(0,255,65,0.4)] hover:shadow-[0_0_40px_rgba(0,255,65,0.8)] tracking-[0.2em] uppercase"
          >
            Voltar ao Menu
          </button>
        </div>
      </div>
    );
  }

  if (gameMode === "multiplayer") {
    return (
      <div className="size-full flex items-center justify-center bg-[#0a0a0f] p-8 overflow-auto">
        {QuestionOverlay}
        <div className="flex flex-col gap-6 w-full max-w-[1600px]">
          <div className="flex items-center justify-center gap-4">
            <h1 className="text-5xl tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#00ff41] via-[#00f5ff] to-[#ff00ff] animate-pulse text-center">
              Tectris - Multiplayer
            </h1>
            {questionActive && (
              <div className="px-4 py-2 bg-[#ff00ff] text-[#0a0a0f] rounded-lg animate-pulse text-sm uppercase tracking-wider">
                Pergunta Ativa
              </div>
            )}
          </div>

          <div className="flex gap-8 justify-center items-start flex-wrap lg:flex-nowrap">
            {/* Player 1 */}
            <div className="flex flex-col items-center gap-4">
              <h2 className="text-3xl text-[#00ff41] tracking-wider uppercase">Player 1</h2>

              <div className="flex gap-4">
                {/* Stats Player 1 */}
                <div className="flex flex-col gap-3">
                  <div className="bg-[#1a1a2e] border-2 border-[#00ff41] p-4 rounded-lg shadow-[0_0_15px_rgba(0,255,65,0.3)] min-w-[140px]">
                    <h3 className="text-[#00ff41] mb-2 tracking-wider uppercase text-sm">Pontos</h3>
                    <div className="text-3xl text-[#00f5ff] font-mono tabular-nums">{scorePlayer1}</div>
                  </div>
                  <div className="bg-[#1a1a2e] border-2 border-[#ff00ff] p-4 rounded-lg shadow-[0_0_15px_rgba(255,0,255,0.3)] min-w-[140px]">
                    <h3 className="text-[#ff00ff] mb-2 tracking-wider uppercase text-sm">Nível</h3>
                    <div className="text-3xl text-[#00f5ff] font-mono tabular-nums">1</div>
                  </div>
                  <div className="bg-[#1a1a2e] border-2 border-[#00f5ff] p-4 rounded-lg shadow-[0_0_15px_rgba(0,245,255,0.3)] min-w-[140px]">
                    <h3 className="text-[#00f5ff] mb-2 tracking-wider uppercase text-sm">Linhas</h3>
                    <div className="text-3xl text-[#00ff41] font-mono tabular-nums">{linesPlayer1}</div>
                  </div>
                </div>

                {/* Tabuleiro Player 1 */}
                <div>
                  <TetrisGame
                    isPaused={showQuestion || isPaused}
                    onScoreChange={setScorePlayer1}
                    onLinesChange={setLinesPlayer1}
                    onGameOver={() => alert("Player 1 - Game Over!")}
                    addPenaltyLine={addPenaltyP1}
                    resetPenalty={() => setAddPenaltyP1(false)}
                    controls="wasd"
                    borderColor="#00ff41"
                  />
                </div>
              </div>
            </div>

            {/* Player 2 */}
            <div className="flex flex-col items-center gap-4">
              <h2 className="text-3xl text-[#ff00ff] tracking-wider uppercase">Player 2</h2>

              <div className="flex gap-4">
                {/* Tabuleiro Player 2 */}
                <div>
                  <TetrisGame
                    isPaused={showQuestion || isPaused}
                    onScoreChange={setScorePlayer2}
                    onLinesChange={setLinesPlayer2}
                    onGameOver={() => alert("Player 2 - Game Over!")}
                    addPenaltyLine={addPenaltyP2}
                    resetPenalty={() => setAddPenaltyP2(false)}
                    controls="arrows"
                    borderColor="#ff00ff"
                  />
                </div>

                {/* Stats Player 2 */}
                <div className="flex flex-col gap-3">
                  <div className="bg-[#1a1a2e] border-2 border-[#00ff41] p-4 rounded-lg shadow-[0_0_15px_rgba(0,255,65,0.3)] min-w-[140px]">
                    <h3 className="text-[#00ff41] mb-2 tracking-wider uppercase text-sm">Pontos</h3>
                    <div className="text-3xl text-[#00f5ff] font-mono tabular-nums">{scorePlayer2}</div>
                  </div>
                  <div className="bg-[#1a1a2e] border-2 border-[#ff00ff] p-4 rounded-lg shadow-[0_0_15px_rgba(255,0,255,0.3)] min-w-[140px]">
                    <h3 className="text-[#ff00ff] mb-2 tracking-wider uppercase text-sm">Nível</h3>
                    <div className="text-3xl text-[#00f5ff] font-mono tabular-nums">1</div>
                  </div>
                  <div className="bg-[#1a1a2e] border-2 border-[#00f5ff] p-4 rounded-lg shadow-[0_0_15px_rgba(0,245,255,0.3)] min-w-[140px]">
                    <h3 className="text-[#00f5ff] mb-2 tracking-wider uppercase text-sm">Linhas</h3>
                    <div className="text-3xl text-[#00ff41] font-mono tabular-nums">{linesPlayer2}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Botões de Controle */}
          <div className="flex gap-4 justify-center mt-4">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="px-8 py-3 bg-[#1a1a2e] border-2 border-[#00ff41] text-[#00ff41] rounded-lg hover:bg-[#00ff41] hover:text-[#0a0a0f] transition-all duration-300 shadow-[0_0_15px_rgba(0,255,65,0.3)] hover:shadow-[0_0_25px_rgba(0,255,65,0.6)] tracking-wider uppercase">
              {isPaused ? "Retomar" : "Pausar"}
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-[#1a1a2e] border-2 border-[#ff00ff] text-[#ff00ff] rounded-lg hover:bg-[#ff00ff] hover:text-[#0a0a0f] transition-all duration-300 shadow-[0_0_15px_rgba(255,0,255,0.3)] hover:shadow-[0_0_25px_rgba(255,0,255,0.6)] tracking-wider uppercase">
              Reiniciar
            </button>
            <button
              onClick={() => setScreen("menu")}
              className="px-8 py-3 bg-[#1a1a2e] border-2 border-[#00f5ff] text-[#00f5ff] rounded-lg hover:bg-[#00f5ff] hover:text-[#0a0a0f] transition-all duration-300 shadow-[0_0_15px_rgba(0,245,255,0.3)] hover:shadow-[0_0_25px_rgba(0,245,255,0.6)] tracking-wider uppercase">
              Menu
            </button>
          </div>

          {/* Controles */}
          <div className="flex gap-8 justify-center mt-4">
            <div className="bg-[#1a1a2e] border-2 border-[#00ff41] p-4 rounded-lg shadow-[0_0_15px_rgba(0,255,65,0.3)]">
              <h3 className="text-[#00ff41] mb-3 tracking-wider uppercase text-center">Player 1</h3>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex gap-4 items-center justify-between">
                  <span className="text-[#717182]">A / D</span>
                  <span className="text-[#00f5ff]">Mover</span>
                </div>
                <div className="flex gap-4 items-center justify-between">
                  <span className="text-[#717182]">W</span>
                  <span className="text-[#00f5ff]">Girar</span>
                </div>
                <div className="flex gap-4 items-center justify-between">
                  <span className="text-[#717182]">S</span>
                  <span className="text-[#00f5ff]">Acelerar</span>
                </div>
                <div className="flex gap-4 items-center justify-between">
                  <span className="text-[#717182]">Q</span>
                  <span className="text-[#00f5ff]">Drop</span>
                </div>
              </div>
            </div>
            <div className="bg-[#1a1a2e] border-2 border-[#ff00ff] p-4 rounded-lg shadow-[0_0_15px_rgba(255,0,255,0.3)]">
              <h3 className="text-[#ff00ff] mb-3 tracking-wider uppercase text-center">Player 2</h3>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex gap-4 items-center justify-between">
                  <span className="text-[#717182]">← / →</span>
                  <span className="text-[#00f5ff]">Mover</span>
                </div>
                <div className="flex gap-4 items-center justify-between">
                  <span className="text-[#717182]">↑</span>
                  <span className="text-[#00f5ff]">Girar</span>
                </div>
                <div className="flex gap-4 items-center justify-between">
                  <span className="text-[#717182]">↓</span>
                  <span className="text-[#00f5ff]">Acelerar</span>
                </div>
                <div className="flex gap-4 items-center justify-between">
                  <span className="text-[#717182]">Space</span>
                  <span className="text-[#00f5ff]">Drop</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="size-full flex items-center justify-center bg-[#0a0a0f] p-8 overflow-auto">
      {QuestionOverlay}
      <div className="flex gap-8 items-start">
        {/* Painel Esquerdo - Stats */}
        <div className="flex flex-col gap-6">
          <div className="bg-[#1a1a2e] border-2 border-[#00ff41] p-6 rounded-lg shadow-[0_0_20px_rgba(0,255,65,0.3)]">
            <h2 className="text-[#00ff41] mb-4 tracking-wider uppercase">Pontuação</h2>
            <div className="text-4xl text-[#00f5ff] font-mono tabular-nums">{scorePlayer1}</div>
          </div>

          <div className="bg-[#1a1a2e] border-2 border-[#ff00ff] p-6 rounded-lg shadow-[0_0_20px_rgba(255,0,255,0.3)]">
            <h2 className="text-[#ff00ff] mb-4 tracking-wider uppercase">Nível</h2>
            <div className="text-4xl text-[#00f5ff] font-mono tabular-nums">1</div>
          </div>

          <div className="bg-[#1a1a2e] border-2 border-[#00f5ff] p-6 rounded-lg shadow-[0_0_20px_rgba(0,245,255,0.3)]">
            <h2 className="text-[#00f5ff] mb-4 tracking-wider uppercase">Linhas</h2>
            <div className="text-4xl text-[#00ff41] font-mono tabular-nums">{linesPlayer1}</div>
          </div>
        </div>

        {/* Tabuleiro Central */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-5xl tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#00ff41] via-[#00f5ff] to-[#ff00ff] animate-pulse">
              Tectris
            </h1>
            {questionActive && (
              <div className="px-4 py-2 bg-[#ff00ff] text-[#0a0a0f] rounded-lg animate-pulse text-sm uppercase tracking-wider">
                Pergunta Ativa
              </div>
            )}
          </div>

          <TetrisGame
            isPaused={showQuestion || isPaused}
            onScoreChange={setScorePlayer1}
            onLinesChange={setLinesPlayer1}
            onGameOver={() => alert("Game Over!")}
            addPenaltyLine={addPenaltyP1}
            resetPenalty={() => setAddPenaltyP1(false)}
          />

          {/* Botões de Controle */}
          <div className="flex gap-4">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="px-8 py-3 bg-[#1a1a2e] border-2 border-[#00ff41] text-[#00ff41] rounded-lg hover:bg-[#00ff41] hover:text-[#0a0a0f] transition-all duration-300 shadow-[0_0_15px_rgba(0,255,65,0.3)] hover:shadow-[0_0_25px_rgba(0,255,65,0.6)] tracking-wider uppercase">
              {isPaused ? "Retomar" : "Pausar"}
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-[#1a1a2e] border-2 border-[#ff00ff] text-[#ff00ff] rounded-lg hover:bg-[#ff00ff] hover:text-[#0a0a0f] transition-all duration-300 shadow-[0_0_15px_rgba(255,0,255,0.3)] hover:shadow-[0_0_25px_rgba(255,0,255,0.6)] tracking-wider uppercase">
              Reiniciar
            </button>
            <button
              onClick={() => setScreen("menu")}
              className="px-8 py-3 bg-[#1a1a2e] border-2 border-[#00f5ff] text-[#00f5ff] rounded-lg hover:bg-[#00f5ff] hover:text-[#0a0a0f] transition-all duration-300 shadow-[0_0_15px_rgba(0,245,255,0.3)] hover:shadow-[0_0_25px_rgba(0,245,255,0.6)] tracking-wider uppercase">
              Menu
            </button>
          </div>
        </div>

        {/* Painel Direito - Controles */}
        <div className="bg-[#1a1a2e] border-2 border-[#00f5ff] p-6 rounded-lg shadow-[0_0_20px_rgba(0,245,255,0.3)]">
          <h3 className="text-[#00f5ff] mb-4 tracking-wider uppercase">Controles</h3>
          <div className="space-y-2 text-sm font-mono">
            <div className="flex justify-between">
              <span className="text-[#717182]">←→</span>
              <span className="text-[#00ff41]">Mover</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#717182]">↑</span>
              <span className="text-[#00ff41]">Girar</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#717182]">↓</span>
              <span className="text-[#00ff41]">Acelerar</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#717182]">Space</span>
              <span className="text-[#00ff41]">Drop</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}