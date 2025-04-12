/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const axios = require('axios');
const cheerio = require('cheerio');

// S3クライアントの初期化
const s3Client = new S3Client({});

// 環境変数からS3バケット名とオブジェクトキーを取得
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;
const S3_OBJECT_KEY = process.env.S3_OBJECT_KEY; // e.g., 'data/game-ids.json'

if (!S3_BUCKET_NAME || !S3_OBJECT_KEY) {
    throw new Error('Environment variables S3_BUCKET_NAME and S3_OBJECT_KEY must be set.');
}

// BGGから指定されたページのボードゲームIDを取得する関数
async function fetchBoardGameIdsFromPage(pageNumber) {
    try {
        const url = `https://boardgamegeek.com/browse/boardgame/page/${pageNumber}`;
        const { data } = await axios.get(url, { timeout: 15000 });
        const $ = cheerio.load(data);
        const gameIds = [];

        $('a.primary').each((_, element) => {
            const href = $(element).attr('href');
            if (href) {
                const parts = href.split('/');
                if (parts.length > 2 && parts[1] === 'boardgame') {
                    const gameId = parts[2];

                    if (gameId && /^\d+$/.test(gameId)) {
                        gameIds.push(gameId);
                    }
                }
            }
        });
        console.log(`Fetched ${gameIds.length} IDs from page ${pageNumber}`);
        return gameIds;
    } catch (error) {
        console.error(`Error fetching data from page ${pageNumber}:`, error instanceof Error ? error.message : error);
        return [];
    }
}

// BGGから全ページのボードゲームIDを取得する関数
async function fetchAllBoardGameIds(minRequiredIds) {
    // BGGの仕様変更や負荷を考慮し、取得ページ数を動的に調整
    const startPage = 1;
    let endPage = 5;
    const maxPagesToFetch = 20; // 最大試行ページ数 (無限ループ防止)
    const allGameIds = [];
    let uniqueGameIds = [];

    console.log(`Fetching game IDs from BGG, aiming for at least ${minRequiredIds} unique IDs...`);

    for (let currentPage = startPage; currentPage <= endPage && currentPage <= maxPagesToFetch; currentPage++) {
        const pageIds = await fetchBoardGameIdsFromPage(currentPage);
        allGameIds.push(...pageIds);
        uniqueGameIds = [...new Set(allGameIds)];
        console.log(`Fetched page ${currentPage}. Total unique IDs so far: ${uniqueGameIds.length}`);

        // 必要なID数を取得できたら、または次のページがない可能性があればループを抜ける
        if (uniqueGameIds.length >= minRequiredIds) {
            console.log(`Reached target number of unique IDs (${minRequiredIds}). Stopping fetch.`);
            break;
        }

        // 現在のページでIDが取得できなかった場合、それ以上ページがない可能性が高い
        if (pageIds.length === 0 && currentPage > startPage) {
            console.log(`No IDs found on page ${currentPage}. Assuming end of results.`);
            break;
        }

        // ループの最後で、まだID数が足りなければ次のページを試す
        if (currentPage === endPage && uniqueGameIds.length < minRequiredIds) {
            endPage++; // 次のページへ
            console.log(`Target not met, increasing fetch range to page ${endPage}`);
        }

        // BGGへの負荷軽減のため、リクエスト間に短い待機時間を設ける (例: 500ms)
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (uniqueGameIds.length < minRequiredIds) {
        console.warn(`Could not fetch the minimum required ${minRequiredIds} unique IDs. Fetched only ${uniqueGameIds.length}.`);
    }

    // 取得したユニークIDを返す
    return uniqueGameIds;
}

// 難易度設定 (新しいロジックに基づく)
const difficultyRanges = [
    { difficulty: 'easy', start: 0, end: 99 },
    { difficulty: 'normal', start: 100, end: 299 },
    { difficulty: 'hard', start: 300, end: 499 },
];
const maxRequiredIds = 500;

// Lambdaハンドラー関数
exports.handler = async (_event, _context) => {
    console.log('Lambda function started.');

    try {
        const allFetchedGameIds = await fetchAllBoardGameIds(maxRequiredIds);

        if (allFetchedGameIds.length < maxRequiredIds) {
            console.warn(`Fetched only ${allFetchedGameIds.length} IDs, less than the required ${maxRequiredIds}. Proceeding with available IDs.`);
            // 必要に応じて、ID数が足りない場合にエラーとするか、処理を続行するかを決定
        }
        if (allFetchedGameIds.length === 0) {
            console.warn('No game IDs were fetched. S3 will not be updated.');
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'No game IDs fetched. S3 not updated.' }),
            };
        }


        // 難易度別にIDを分類
        const categorizedIds = {
            easy: [],
            normal: [],
            hard: [],
        };

        allFetchedGameIds.forEach((gameId, index) => {
            if (index >= difficultyRanges[0].start && index <= difficultyRanges[0].end) {
                categorizedIds.easy.push(gameId);
            } else if (index >= difficultyRanges[1].start && index <= difficultyRanges[1].end) {
                categorizedIds.normal.push(gameId);
            } else if (index >= difficultyRanges[2].start && index <= difficultyRanges[2].end) {
                categorizedIds.hard.push(gameId);
            }
        });

        console.log(`Categorized IDs: Easy(${categorizedIds.easy.length}), Normal(${categorizedIds.normal.length}), Hard(${categorizedIds.hard.length})`);

        // JSONデータを作成
        const jsonData = {
            updatedAt: new Date().toISOString(),
            ids: categorizedIds,
        };

        // S3にアップロード
        const putObjectParams = {
            Bucket: S3_BUCKET_NAME,
            Key: S3_OBJECT_KEY,
            Body: JSON.stringify(jsonData, null, 2),
            ContentType: 'application/json',
        };

        console.log(`Attempting to upload game IDs JSON to s3://${S3_BUCKET_NAME}/${S3_OBJECT_KEY}`);
        const command = new PutObjectCommand(putObjectParams);
        await s3Client.send(command);
        console.log('Successfully uploaded game IDs JSON to S3.');

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `Successfully fetched and uploaded game IDs to s3://${S3_BUCKET_NAME}/${S3_OBJECT_KEY}`,
                counts: {
                    easy: categorizedIds.easy.length,
                    normal: categorizedIds.normal.length,
                    hard: categorizedIds.hard.length,
                }
            }),
        };
    } catch (error) {
        console.error('Error in Lambda handler:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error', error: error instanceof Error ? error.message : String(error) }),
        };
    }
};
