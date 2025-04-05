import React from 'react';
import { Boardgame } from '@/types/boardgame';
import { QuizGameCard } from './quiz-game-card';

interface QuizQuestionProps {
    questionText: string;
    gameA: Boardgame;
    gameB: Boardgame;
    selectedAnswer: string | null;
    correctAnswerId: string | null;
    showFeedback: boolean;
    onAnswer: (selectedGameId: string) => void;
}

export function QuizQuestion({
    questionText,
    gameA,
    gameB,
    selectedAnswer,
    correctAnswerId,
    showFeedback,
    onAnswer,
}: QuizQuestionProps) {
    const getFeedback = (gameId: string): 'correct' | 'incorrect' | null => {
        if (!showFeedback || !selectedAnswer || !correctAnswerId) {
            return null;
        }
        if (gameId === correctAnswerId) {
            return 'correct';
        }
        if (gameId === selectedAnswer) {
            return 'incorrect';
        }
        return null;
    };

    return (
        <div className="flex flex-col items-center w-full">
            <h2 className="text-2xl md:text-4xl text-center mb-8">
                {questionText}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full md:justify-items-center">
                <QuizGameCard
                    game={gameA}
                    onClick={() => onAnswer(gameA.id)}
                    isSelected={selectedAnswer === gameA.id}
                    feedback={getFeedback(gameA.id)}
                />
                <QuizGameCard
                    game={gameB}
                    onClick={() => onAnswer(gameB.id)}
                    isSelected={selectedAnswer === gameB.id}
                    feedback={getFeedback(gameB.id)}
                />
            </div>
        </div>
    );
}
