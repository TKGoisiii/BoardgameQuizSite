'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export function QuizError({ error }: { error: string }) {
    const handleRetry = () => {
        window.location.reload();
    };

    return (
        <div className="flex flex-col items-center justify-center text-center p-4 border border-destructive rounded-md bg-destructive/10">
            <AlertTriangle className="w-8 h-8 text-destructive mb-3" />
            <h2 className="text-lg font-semibold text-destructive mb-1">エラー発生</h2>
            <p className="text-sm text-destructive/80 mb-4">{error}</p>
            <Button onClick={handleRetry} variant="destructive" size="default">
                再試行
            </Button>
        </div>
    );
}
