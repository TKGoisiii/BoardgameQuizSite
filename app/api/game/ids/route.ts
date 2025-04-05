import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

// キャッシュ変数
let cachedGameIds: string[] = [];
let cacheTimestamp: number | null = null;
const CACHE_DURATION_MS = 60 * 60 * 24 * 1000; // 1日

// 指定されたページのボードゲームIDを取得する
async function fetchBoardGameIdsFromPage(pageNumber: number): Promise<string[]> {
    try {
        const url = `https://boardgamegeek.com/browse/boardgame/page/${pageNumber}`;

        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        const gameIds: string[] = [];

        $('a.primary').each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
            const parts = href.split('/');
            if (parts.length > 2 && parts[1] === 'boardgame') {
            const gameId = parts[2];
            if (gameId && !isNaN(parseInt(gameId))) {
                gameIds.push(gameId);
            }
            }
        }
        });

        return gameIds;
    } catch (error) {
        console.error(`ページ ${pageNumber} のデータ取得中にエラーが発生しました:`, error instanceof Error ? error.message : error);
        return []; // エラー時も空配列を返す
    }
}

// 全ページのボードゲームIDを取得する
async function fetchAllBoardGameIds(): Promise<string[]> {
    const startPage = 1;
    const endPage = 3;
    let allGameIds: string[] = [];

    const pagePromises: Promise<string[]>[] = [];
    for (let page = startPage; page <= endPage; page++) {
        pagePromises.push(fetchBoardGameIdsFromPage(page));
    }

    try {
        const results = await Promise.all(pagePromises);
        allGameIds = results.flat();
        return allGameIds;
    } catch (error) {
        console.error('全ページのデータ取得処理中にエラーが発生しました:', error);
        return []; // エラー時も空配列を返す
    }
}

export async function GET() {
    const now = Date.now();

    // キャッシュの有効性をチェック
    if (cachedGameIds.length > 0 && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION_MS)) {
        console.log('キャッシュからゲームIDリストを返します。');
        return NextResponse.json({ gameIds: cachedGameIds });
    }

    console.log('キャッシュが無効または存在しないため、データを再取得します。');
    try {
        const gameIds = await fetchAllBoardGameIds();

        if (gameIds.length > 0) {
        // 取得成功した場合のみキャッシュを更新
        cachedGameIds = gameIds;
        cacheTimestamp = now;
        console.log('ゲームIDリストをキャッシュしました。');
        } else {
            // 取得に失敗した場合（空配列が返ってきた場合）はエラーレスポンス
            console.error('ゲームIDの取得に失敗しました。空のリストが返されました。');
            // 既存のキャッシュがあればそれを返し、なければエラーを返す
            if (cachedGameIds.length > 0) {
                console.warn('取得失敗のため、古いキャッシュを返します。');
                return NextResponse.json({ gameIds: cachedGameIds, warning: 'Failed to refresh data, returning stale cache.' });
            } else {
                return NextResponse.json({ error: 'Failed to fetch game IDs and no cache available.' }, { status: 500 });
            }
        }

        return NextResponse.json({ gameIds });
    } catch (error) {
        console.error('APIルートでのゲームID取得中にエラーが発生しました:', error);
        // エラーが発生した場合、既存のキャッシュがあればそれを返し、なければエラーを返す
        if (cachedGameIds.length > 0) {
            console.warn('取得エラーのため、古いキャッシュを返します。');
            return NextResponse.json({ gameIds: cachedGameIds, error: 'Failed to refresh data, returning stale cache.' });
        } else {
            return NextResponse.json({ error: 'Internal Server Error while fetching game IDs.' }, { status: 500 });
        }
    }
}
