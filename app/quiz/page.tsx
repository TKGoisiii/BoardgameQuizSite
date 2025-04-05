import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Boardgame } from '@/types/boardgame';
import { QuizError } from '@/components/quiz/quiz-error';
import { QuizClient } from '@/components/quiz/quiz-client';

interface QuizDataFromApi {
  questionText: string;
  gameA: Boardgame;
  gameB: Boardgame;
  correctAnswerId: string;
}

export default async function QuizPage() {
  try {
    // 環境変数からベースURLを取得
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/quiz/question`, {
      cache: 'no-store' // SSR用にキャッシュを無効化
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch quiz data');
    }
    
    const initialData: QuizDataFromApi = await response.json();
    
    return (
      <div className="flex flex-col flex-grow p-2 sm:p-4">
        <div className="flex flex-col flex-grow rounded-lg shadow-sm bg-card text-card-foreground md:w-[70%] mx-auto w-full border-3">
          <CardHeader className="p-3 sm:p-4 border-b-3">
            <CardTitle className="text-center text-base sm:text-2l font-semibold">
              ボードゲームクイズ(BETA版)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col flex-grow p-3 sm:p-4 overflow-y-auto items-center justify-center">
            <QuizClient initialData={initialData} />
          </CardContent>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="flex items-center justify-center flex-grow">
        <QuizError 
          error={error instanceof Error ? error.message : 'Unknown error'} 
        />
      </div>
    );
  }
}