'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Boardgame } from '@/types/boardgame';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Card を削除
import { QuizLoading } from '@/components/quiz/quiz-loading';
import { QuizError } from '@/components/quiz/quiz-error';
import { QuizQuestion } from '@/components/quiz/quiz-question';
import { QuizFeedback } from '@/components/quiz/quiz-feedback';
import { QuizControls } from '@/components/quiz/quiz-controls';
import { cn } from '@/lib/utils'; // cnユーティリティを再インポート

// APIからのレスポンスデータの型
interface QuizDataFromApi {
  questionText: string;
  gameA: Boardgame;
  gameB: Boardgame;
  correctAnswerId: string;
}

// ページ内で使用するクイズデータの型 (questionNumber を含む)
interface Quiz extends QuizDataFromApi {
    id: number;
}

export default function QuizPage() {
  const [currentQuestion, setCurrentQuestion] = useState<Quiz | null>(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const router = useRouter();

  // エラーリトライ用の安定した関数
  const triggerRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
  }, []); // 依存配列が空なので関数は再生成されない

  // 問題データの読み込み (useEffect内で実行)
  useEffect(() => {
    let isActive = true; // アンマウント時の状態更新を防ぐフラグ

    const fetchQuestion = async () => {
      setIsLoading(true);
      setError(null);
      setSelectedAnswer(null);
      setIsCorrect(null);
      setShowFeedback(false);

      try {
        const response = await fetch('/api/quiz/question');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `API request failed: ${response.status}`);
        }
        const data: QuizDataFromApi = await response.json();
        const quizData: Quiz = { ...data, id: questionNumber };

        if (isActive) {
          setCurrentQuestion(quizData);
        }
      } catch (err) {
        console.error("Error loading question:", err);
        if (isActive) {
          setError(err instanceof Error ? err.message : "不明なエラーが発生しました。");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    fetchQuestion();

    return () => {
      isActive = false;
    };
  }, [questionNumber, retryCount]);

  // 回答ハンドラー
  const handleAnswer = (selectedGameId: string) => {
    if (!currentQuestion || selectedAnswer) return;

    const correct = selectedGameId === currentQuestion.correctAnswerId;
    setSelectedAnswer(selectedGameId);
    setIsCorrect(correct);
    setShowFeedback(true);

    if (correct) {
      setScore(prevScore => prevScore + 1);
    }
  };

  // 次の問題へ進むハンドラー
  const handleNextQuestion = () => {
    // 10問目以降なら結果ページへリダイレクト
    if (questionNumber >= 10) {
      router.push(`/quiz/result?score=${score}`);
    } else {
      // 次の問題番号へ更新 (useEffectがこれを検知してloadQuestionを呼ぶ)
      setQuestionNumber(prev => prev + 1);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <QuizLoading />;
    }

    if (error) {
      return <QuizError error={error} onRetry={triggerRetry} />;
    }

    if (!currentQuestion) {
      return <div>クイズデータを読み込めませんでした。</div>;
    }

    // 通常のクイズコンテンツ
    return (
      <>
        <QuizQuestion
          questionText={currentQuestion.questionText}
          gameA={currentQuestion.gameA}
          gameB={currentQuestion.gameB}
          selectedAnswer={selectedAnswer}
          correctAnswerId={currentQuestion.correctAnswerId}
          showFeedback={showFeedback}
          onAnswer={handleAnswer}
        />

        {/* 回答後にフィードバックとコントロールを表示 */}
        {/* cn を使用して表示/非表示を制御 */}
        <div className={cn(
          "mt-4 w-full flex flex-col items-center transition-opacity duration-300",
          selectedAnswer ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}>
          {selectedAnswer && currentQuestion && (
            <>
              <QuizFeedback
                isCorrect={isCorrect}
                gameA={currentQuestion.gameA}
                gameB={currentQuestion.gameB}
                correctAnswerId={currentQuestion.correctAnswerId}
              />
              <QuizControls
                score={score}
                questionNumber={questionNumber}
                onNextQuestion={handleNextQuestion}
              />
            </>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="flex flex-col flex-grow p-2 sm:p-4">
      <div className="flex flex-col flex-grow rounded-lg shadow-sm bg-card text-card-foreground md:w-[70%] mx-auto w-full border-3">
        <CardHeader className="p-3 sm:p-4 border-b-3">
          <CardTitle className="text-center text-base sm:text-lg font-semibold">
            ボードゲームクイズ ({questionNumber}/10)
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col flex-grow p-3 sm:p-4 overflow-y-auto">
          <div className="flex flex-col items-center justify-center flex-grow">
            {renderContent()}
          </div>
        </CardContent>
      </div>
    </div>
  );
}
