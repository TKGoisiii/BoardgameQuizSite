import { NextResponse } from 'next/server';
import { Boardgame } from '@/types/boardgame';

export const dynamic = 'force-dynamic';

// 環境変数からベースURLを取得、なければ localhost を仮定
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// ゲームIDリストを取得する関数
async function getGameIds(): Promise<string[]> {
  try {
    // fetchのキャッシュを無効化
    const res = await fetch(`${baseUrl}/api/game/ids`, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`Failed to fetch game IDs: ${res.status}`);
    }
    const data = await res.json();
    if (data.error || !data.gameIds) {
      throw new Error(data.error || 'No gameIds found in response');
    }
    return data.gameIds;
  } catch (error) {
    console.error('Error fetching game IDs:', error);
    throw new Error('Failed to fetch game IDs'); // エラーを再スロー
  }
}

// 単一のゲームデータを取得する関数
async function getGameData(id: string): Promise<Boardgame | null> {
  try {
    // fetchのキャッシュを無効化
    const res = await fetch(`${baseUrl}/api/game/${id}`, { cache: 'no-store' });

    // /api/game/[id] が 404 を返した場合 (JSONエラー含む) は null を返す
    if (res.status === 404) {
        console.warn(`Game data not found via API for ID ${id} (404 status received)`);
        return null;
    }

    // その他のエラーチェック
    if (!res.ok) {
      console.error(`Failed to fetch game data for ID ${id}: ${res.status} ${res.statusText}`);
      // レスポンスボディをログに出力してみる（デバッグ用）
      try {
        const errorBody = await res.text();
        console.error(`Error response body for ID ${id}: ${errorBody}`);
      } catch { // Remove unused error variable declaration
        console.error(`Could not read error response body for ID ${id}`);
      }
      return null; // 404以外のエラーもnullを返す
    }

    // 正常な応答の場合
    const data: Boardgame = await res.json();
    // データが空や不正な形式でないか基本的なチェックを追加しても良い
    if (!data || !data.id) {
        console.warn(`Received invalid game data structure for ID ${id}`);
        return null;
    }
    return data;
  } catch (error) {
    console.error(`Error fetching game data for ID ${id}:`, error);
    return null; // その他のエラーもnull
  }
}

// 配列からランダムに指定された数の重複しない要素を選択
function selectRandomDistinctItems<T>(array: T[], count: number): T[] {
  if (!array || array.length < count) return []; // 十分な要素がない場合は空配列
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export async function GET() {
  try {
    const gameIds = await getGameIds();
    if (gameIds.length < 2) {
      return NextResponse.json({ error: 'Not enough game IDs available to create a quiz question.' }, { status: 500 });
    }

    let gameA: Boardgame | null = null;
    let gameB: Boardgame | null = null;
    let attempts = 0;
    const maxAttempts = 10; // 無限ループを防ぐための試行回数制限

    // 有効なゲームデータが2つ取得できるまで試行
    while ((!gameA || !gameB) && attempts < maxAttempts) {
        attempts++;
        const selectedIds = selectRandomDistinctItems(gameIds, 2);
        if (selectedIds.length < 2) continue; // 念のためチェック

        const [fetchedGameA, fetchedGameB] = await Promise.all([
            getGameData(selectedIds[0]),
            getGameData(selectedIds[1])
        ]);

        // 両方のゲームデータが取得できた場合のみ採用
        if (fetchedGameA && fetchedGameB) {
            gameA = fetchedGameA;
            gameB = fetchedGameB;
        } else {
            console.warn(`Attempt ${attempts}: Failed to fetch valid data for IDs ${selectedIds.join(', ')}. Retrying...`);
        }
    }

    if (!gameA || !gameB) {
      console.error(`Failed to fetch two valid games after ${maxAttempts} attempts.`);
      return NextResponse.json({ error: 'Failed to retrieve valid game data for the quiz.' }, { status: 500 });
    }

    // 正解を決定 (平均評価が高い方)
    const ratingA = parseFloat(gameA.statistics?.ratings?.average || '0');
    const ratingB = parseFloat(gameB.statistics?.ratings?.average || '0');

    // 評価が同じ場合はランダムに正解を決める（または別の基準を使う）
    let correctAnswerId: string;
    if (ratingA > ratingB) {
        correctAnswerId = gameA.id;
    } else if (ratingB > ratingA) {
        correctAnswerId = gameB.id;
    } else {
        // 評価が同じ場合、ランダムに選択
        correctAnswerId = Math.random() < 0.5 ? gameA.id : gameB.id;
        console.log(`Ratings are equal (${ratingA}). Randomly selected ${correctAnswerId} as correct.`);
    }

    const questionText = `評価が高いのはどっち？`; // 問題文は固定（将来的に変更可能）

    const quizData = {
      questionText: questionText,
      gameA: gameA,
      gameB: gameB,
      correctAnswerId: correctAnswerId,
    };

    return NextResponse.json(quizData);

  } catch (error) {
    console.error('Error generating quiz question:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: `Failed to generate quiz question: ${errorMessage}` }, { status: 500 });
  }
}
