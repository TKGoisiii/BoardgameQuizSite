import React from 'react';
import { Button } from '@/components/ui/button';

interface QuizControlsProps {
    score: number;
    questionNumber: number;
    onNextQuestion: () => void;
}

export function QuizControls({
    score,
    questionNumber,
    onNextQuestion,
}: QuizControlsProps) {

    return (
        <div className="w-full flex flex-col items-center">
            <Button
                onClick={onNextQuestion}
                size="lg"
                className="mb-3"
            >
                {questionNumber < 10 ? '次の問題へ' : '結果を見る'}
            </Button>
            <p className="text-sm sm:text-base">現在のスコア: {score}</p>
        </div>
    );
}
