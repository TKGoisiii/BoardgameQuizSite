import Link from 'next/link';
import React from 'react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center flex-grow p-4 text-center">
      <h1 className="text-2xl font-semibold mb-4 sm:text-3xl">ボードゲーム クイズ(BETA版)</h1>
      <p className="text-sm text-muted-foreground mb-8 sm:text-base">
        ボードゲームに関する知識を試してみよう！
      </p>
      <Link href="/quiz" passHref>
        <Button size="lg">ゲームスタート</Button>
      </Link>
    </div>
  );
}
