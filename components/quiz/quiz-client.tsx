'use client';

import { useState, useCallback } from 'react'; // Remove useEffect
import { useRouter } from 'next/navigation';
import { Boardgame } from '@/types/boardgame';
import { QuizLoading } from '@/components/quiz/quiz-loading';
import { QuizQuestion } from '@/components/quiz/quiz-question';
import { QuizFeedback } from '@/components/quiz/quiz-feedback';
import { QuizControls } from '@/components/quiz/quiz-controls';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button'; // Buttonコンポーネントをインポート
import { QuizError } from './quiz-error';

// Difficulty 型を定義
const VALID_DIFFICULTIES = ['easy', 'normal', 'hard'] as const;
type Difficulty = typeof VALID_DIFFICULTIES[number];

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
    const [isLoading, setIsLoading] = useState(false); // 初期状態はローディングしない
    const [error, setError] = useState<string | null>(null);
    const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null); // 選択された難易度の状態
    const router = useRouter();

    const fetchQuestion = useCallback(async (difficulty: Difficulty) => {
        setIsLoading(true); // フェッチ開始時にローディング
        setError(null);
        try {
            // 難易度をクエリパラメータに追加
            const response = await fetch(`/api/quiz/question?difficulty=${difficulty}`, {
                cache: 'no-store'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch question');
            }
            const data: QuizData = await response.json();

            setCurrentQuestion(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            setCurrentQuestion(null); // エラー時は質問をクリア
        } finally {
            setIsLoading(false);
        }
    }, []); // 依存配列は空のまま

    // 難易度選択ハンドラー
    const handleDifficultySelect = (difficulty: Difficulty) => {
        setSelectedDifficulty(difficulty);
        setQuestionNumber(1); // 質問番号リセット
        setScore(0); // スコアリセット
        setSelectedAnswer(null); // 回答リセット
        setShowFeedback(false); // フィードバック非表示
        fetchQuestion(difficulty); // 選択された難易度で最初の質問を取得
    };

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

        if (questionNumber < 10 && selectedDifficulty) { // 難易度が選択されていることを確認
            setQuestionNumber(prev => prev + 1);
            await fetchQuestion(selectedDifficulty); // 現在の難易度で次の質問を取得
        } else {
            // 結果ページに難易度も渡す (任意)
            router.push(`/quiz/result?score=${score}&difficulty=${selectedDifficulty}`);
        }
    };

    // --- レンダリングロジック ---

    // 1. 難易度選択画面
    if (!selectedDifficulty) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 p-8">
                <h2 className="text-2xl font-semibold mb-4">難易度を選択してください</h2>
                <div className="flex gap-4">
                    {VALID_DIFFICULTIES.map((diff) => (
                        <Button key={diff} onClick={() => handleDifficultySelect(diff)} size="lg">
                            {diff.charAt(0).toUpperCase() + diff.slice(1)}
                        </Button>
                    ))}
                </div>
                {error && <p className="text-red-500 mt-4">エラー: {error}</p>}
            </div>
        );
    }

    // 2. ローディング中
    if (isLoading) {
        return <QuizLoading />;
    }

    // 3. エラー発生時 (難易度選択後)
    if (error) {
        return (
            <>
                <QuizError error={error} />
                <Button onClick={() => setSelectedDifficulty(null)} className="mt-4">
                    難易度選択に戻る
                </Button>
            </>
        );
    }

    // 4. 質問データがない場合 (フェッチ後だがエラーではない稀なケース)
    if (!currentQuestion) {
        return (
            <>
                <QuizError error="クイズデータの読み込みに失敗しました。" />
                <Button onClick={() => setSelectedDifficulty(null)} className="mt-4">
                    難易度選択に戻る
                </Button>
            </>
        );
    }

    // 5. 通常のクイズ表示
    return (
        <>
            <div className="mb-2 text-sm text-gray-600">
                難易度: {selectedDifficulty} | {questionNumber} / 10 問目
            </div>
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
