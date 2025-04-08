import React from 'react';
import Image from 'next/image';
import { Boardgame } from '@/types/boardgame';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getGameName } from '@/lib/game';

interface QuizGameCardProps {
    game: Boardgame;
    isSelected: boolean;
    onClick: () => void;
    feedback?: 'correct' | 'incorrect' | null;
}

export function QuizGameCard({ game, isSelected, onClick, feedback = null }: QuizGameCardProps) {
    const fallbackImage = '/vercel.svg';
    const gameName = getGameName(game);

    const ringClass = feedback === 'correct'
        ? 'ring-2 ring-offset-2 ring-green-500'
        : feedback === 'incorrect'
        ? 'ring-2 ring-offset-2 ring-red-500'
        : '';

    return (
        <Card
            className={cn(
                "cursor-pointer transition-all duration-200 overflow-hidden w-full",
                "md:max-w-[640px]",
                !isSelected && !feedback && "hover:scale-105",
                isSelected && 'opacity-70',
                feedback && 'pointer-events-none', 
                ringClass
            )}
            onClick={!isSelected && !feedback ? onClick : undefined}
        >
            <div className="relative w-full aspect-square bg-muted/30">
                <Image
                    src={game.image || game.thumbnail || fallbackImage}
                    alt={gameName}
                    fill
                    style={{ objectFit: 'contain', imageRendering: 'pixelated' }}
                    quality={75} // 画質 (0-100)
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                    priority
                />
            </div>
            <div className="p-2 sm:p-3 text-center">
                <CardTitle className="text-xs sm:text-sm font-semibold truncate mb-0.5">
                    {gameName}
                </CardTitle>
                <CardContent className="p-0 text-xs sm:text-xs text-muted-foreground">
                    <p>出版年: {game.yearpublished || 'N/A'}</p>
                </CardContent>
            </div>
        </Card>
    );
}
