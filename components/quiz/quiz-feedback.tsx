import React from 'react';
import { Boardgame } from '@/types/boardgame';
import { CheckCircle, XCircle } from 'lucide-react';
import { getGameName, getRatingValue } from '@/lib/game';

interface QuizFeedbackProps {
    isCorrect: boolean | null;
    gameA: Boardgame;
    gameB: Boardgame;
    correctAnswerId: string;
}

export function QuizFeedback({ isCorrect, gameA, gameB, correctAnswerId }: QuizFeedbackProps) {
    if (isCorrect === null) {
        return null;
    }

    const gameAName = getGameName(gameA);
    const gameARating = getRatingValue(gameA, 'average');
    const gameBName = getGameName(gameB);
    const gameBRating = getRatingValue(gameB, 'average');

    const isGameACorrect = gameA.id === correctAnswerId;

    return (
        <div className="w-full text-center mb-4">
            <div className="flex items-center justify-center mb-2">
                {isCorrect ? (
                    <CheckCircle className="w-5 h-5 text-green-500 mr-1.5" />
                ) : (
                    <XCircle className="w-5 h-5 text-red-500 mr-1.5" />
                )}
                <p className={`text-base sm:text-lg font-medium ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                    {isCorrect ? '正解！' : '不正解...'}
                </p>
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground space-y-0.5">
                <div>
                    <p className={`font-medium ${isGameACorrect ? 'text-primary' : ''}`}>
                        {gameAName} {isGameACorrect ? '(正解)' : ''}
                    </p>
                    <p>(評価: {gameARating})</p>
                </div>
                <div>
                    <p className={`font-medium ${!isGameACorrect ? 'text-primary' : ''}`}>
                        {gameBName} {!isGameACorrect ? '(正解)' : ''}
                    </p>
                    <p>(評価: {gameBRating})</p>
                </div>
            </div>
        </div>
    );
}
