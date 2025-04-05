'use client';

import React, { Suspense } from 'react'; // Suspense をインポート
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function ResultDisplay() {
    const searchParams = useSearchParams();
    const score = searchParams.get('score');
    const scoreValue = score ? parseInt(score, 10) : 0;

    // スコアに応じたメッセージ
    let message = '';
    if (scoreValue >= 8) {
        message = '素晴らしい！ボードゲーム博士ですね！';
    } else if (scoreValue >= 5) {
        message = 'おしい！なかなかの知識です！';
    } else {
        message = 'もう少し！また挑戦してみてね！';
    }

    return (
        <Card className="w-full max-w-sm border-3">
            <CardHeader className="p-4 sm:p-6 border-b-3">
                <CardTitle className="text-center text-xl sm:text-2xl font-semibold">クイズ結果</CardTitle>
            </CardHeader>
            <CardContent className="text-center p-4 sm:p-6">
                <p className="text-4xl sm:text-5xl font-bold my-4 sm:my-6">
                {scoreValue} / 10
                </p>
                <p className="text-base sm:text-lg mb-6 sm:mb-8">{message}</p>
                <Link href="/" passHref>
                    <Button size="lg">トップに戻る</Button>
                </Link>
            </CardContent>
        </Card>
    );
}

export default function ResultPage() {
    return (
        <div className="flex flex-col items-center justify-center flex-grow p-4">
            <Suspense fallback={<div className="text-sm text-muted-foreground animate-pulse">結果を読み込み中...</div>}>
                <ResultDisplay />
            </Suspense>
        </div>
    );
}
