import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QuizClient } from '@/components/quiz/quiz-client';

export default function QuizPage() {
  return (
    <div className="flex flex-col flex-grow p-2 sm:p-4">
      <div className="flex flex-col flex-grow rounded-lg shadow-sm bg-card text-card-foreground md:w-[70%] mx-auto w-full border-3">
        <CardHeader className="p-3 sm:p-4 border-b-3">
          <CardTitle className="text-center text-base sm:text-2l font-semibold">
            ボードゲームクイズ(BETA版)
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col flex-grow p-3 sm:p-4 overflow-y-auto items-center justify-center">
          <QuizClient />
        </CardContent>
      </div>
    </div>
  );
}
