'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Boardgame } from '@/types/boardgame';
import { QuizLoading } from '@/components/quiz/quiz-loading';
import { QuizQuestion } from '@/components/quiz/quiz-question';
import { QuizFeedback } from '@/components/quiz/quiz-feedback';
import { QuizControls } from '@/components/quiz/quiz-controls';
import { cn } from '@/lib/utils';
import { QuizError } from './quiz-error';

interface QuizClientProps {
    initialData: {
        questionText: string;
        gameA: Boardgame;
        gameB: Boardgame;
        correctAnswerId: string;
    };
}

export function QuizClient({ initialData }: QuizClientProps) {
    const [currentQuestion, setCurrentQuestion] = useState(initialData);
    const [questionNumber, setQuestionNumber] = useState(1);
    const [score, setScore] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const isCorrect = selectedAnswer === currentQuestion.correctAnswerId;

    const fetchQuestion = async () => {
        setIsLoading(true);
        setError(null);
        try {
        const response = await fetch('/api/quiz/question');
        if (!response.ok) {
            throw new Error('Failed to fetch question');
        }
        const data = await response.json();
        setCurrentQuestion(data);
        } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
        setIsLoading(false);
        }
    };

    const handleAnswer = (selectedGameId: string) => {
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
        await fetchQuestion();
        } else {
        router.push(`/quiz/result?score=${score}`);
        }
    };

    if (isLoading) {
        return <QuizLoading />;
    }

    if (error) {
        return <QuizError error={error} />;
    }

    if (!currentQuestion) {
        return <div>クイズデータを読み込めませんでした。</div>;
    }

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
}