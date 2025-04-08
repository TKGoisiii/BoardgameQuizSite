'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Boardgame } from '@/types/boardgame';
import { QuizLoading } from '@/components/quiz/quiz-loading';
import { QuizQuestion } from '@/components/quiz/quiz-question';
import { QuizFeedback } from '@/components/quiz/quiz-feedback';
import { QuizControls } from '@/components/quiz/quiz-controls';
import { cn } from '@/lib/utils';
import { QuizError } from './quiz-error';

interface QuizData {
    questionText: string;
    gameA: Boardgame;
    gameB: Boardgame;
    correctAnswerId: string;
}

export function QuizClient() {
    const [currentQuestion, setCurrentQuestion] = useState<QuizData | null>(null);
    const [questionNumber, setQuestionNumber] = useState(1);
    const [score, setScore] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // 初期ロード状態を追加
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const fetchQuestion = useCallback(async () => {
        // ローディング状態の設定は呼び出し元で行う
        setError(null); // エラー状態をリセット
        try {
            const response = await fetch('/api/quiz/question', {
                cache: 'no-store'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch question');
            }
            const data: QuizData = await response.json();

            setCurrentQuestion(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    }, []); // 依存配列を空にする

    // 初期データ取得用のuseEffect
    useEffect(() => {
        fetchQuestion();
    }, [fetchQuestion]); // fetchQuestion を依存配列に追加

    const isCorrect = selectedAnswer !== null && currentQuestion !== null && selectedAnswer === currentQuestion.correctAnswerId;

    const handleAnswer = (selectedGameId: string) => {
        if (!currentQuestion) return;
        setSelectedAnswer(selectedGameId);
        setShowFeedback(true);
        if (selectedGameId === currentQuestion.correctAnswerId) {
            setScore(prev => prev + 1);
        }
    };

    const handleNextQuestion = async () => {
        setSelectedAnswer(null);
        setShowFeedback(false);

        if (questionNumber < 10) {
            setQuestionNumber(prev => prev + 1);
            setIsLoading(true); // 次の質問をロードする前にローディング状態にする
            await fetchQuestion();
        } else {
            router.push(`/quiz/result?score=${score}`);
        }
    };

    // 初期ロード中または次の問題ロード中
    if (isLoading) {
        return <QuizLoading />;
    }

    // エラー発生時
    if (error) {
        return <QuizError error={error} />;
    }

    // データ取得後、currentQuestion がまだ null の場合 (通常は発生しないはずだが念のため)
    if (!currentQuestion) {
        return <QuizError error="クイズデータの読み込みに失敗しました。" />;
    }

    // 通常の表示
    return (
        <>
            <p>{questionNumber} / 10 問目</p>
            <QuizQuestion
                questionText={currentQuestion.questionText}
                gameA={currentQuestion.gameA}
                gameB={currentQuestion.gameB}
                selectedAnswer={selectedAnswer}
                correctAnswerId={currentQuestion.correctAnswerId}
                showFeedback={showFeedback}
                onAnswer={handleAnswer}
            />

            <div className={cn(
                "mt-4 w-full flex flex-col items-center transition-opacity duration-300",
                selectedAnswer ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}>
                {selectedAnswer && (
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
}
