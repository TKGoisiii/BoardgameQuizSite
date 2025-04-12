import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

// --- Cache Configuration ---
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour cache duration
let cachedGameData: GameData | null = null;
let cacheTimestamp: number | null = null;
// -------------------------

// 環境変数からAWSリージョン、S3バケット名、オブジェクトキーを取得
const AWS_REGION = process.env.MY_AWS_REGION;
const S3_BUCKET_NAME = process.env.MY_S3_BUCKET_NAME;
const S3_OBJECT_KEY = process.env.MY_S3_OBJECT_KEY;
// Read custom environment variables for credentials
const MY_AWS_ACCESS_KEY_ID = process.env.MY_AWS_ACCESS_KEY_ID;
const MY_AWS_SECRET_ACCESS_KEY = process.env.MY_AWS_SECRET_ACCESS_KEY;

// S3クライアントの初期化 (リージョンとカスタム認証情報を明示的に指定)
const s3Client = new S3Client({
    region: AWS_REGION,
    credentials: {
        accessKeyId: MY_AWS_ACCESS_KEY_ID || '', // Fallback to empty string if undefined
        secretAccessKey: MY_AWS_SECRET_ACCESS_KEY || '', // Fallback to empty string if undefined
    }
});

// Check for required environment variables (認証情報もチェックに追加)
if (!AWS_REGION || !S3_BUCKET_NAME || !S3_OBJECT_KEY || !MY_AWS_ACCESS_KEY_ID || !MY_AWS_SECRET_ACCESS_KEY) {
    console.error('Environment variables AWS_REGION, S3_BUCKET_NAME, S3_OBJECT_KEY, MY_AWS_ACCESS_KEY_ID, and MY_AWS_SECRET_ACCESS_KEY must be set.');
    // Consider throwing an error or handling appropriately for production
}

// 有効な難易度を定義
const VALID_DIFFICULTIES = ['easy', 'normal', 'hard'] as const;
type Difficulty = typeof VALID_DIFFICULTIES[number];

// Define the expected structure of the JSON data from S3
interface GameData {
    updatedAt: string;
    ids: {
        easy: string[];
        normal: string[];
        hard: string[];
    };
}

// Helper function to stream S3 body to string
const streamToString = (stream: Readable): Promise<string> =>
    new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    });


// S3からゲームIDデータを取得する関数 (キャッシュ更新も担当)
async function fetchAndCacheGameDataFromS3(): Promise<GameData | null> {
    if (!S3_BUCKET_NAME || !S3_OBJECT_KEY) {
        console.error('S3 bucket name or object key is not configured.');
        return null;
    }

    const getObjectParams = {
        Bucket: S3_BUCKET_NAME,
        Key: S3_OBJECT_KEY,
    };

    try {
        console.log(`Fetching fresh game data from s3://${S3_BUCKET_NAME}/${S3_OBJECT_KEY}`);
        const command = new GetObjectCommand(getObjectParams);
        const data = await s3Client.send(command);

        if (!data.Body) {
            console.error('S3 object body is empty.');
            return null;
        }

        if (data.Body instanceof Readable) {
            const bodyString = await streamToString(data.Body);
            const jsonData: GameData = JSON.parse(bodyString);
            console.log(`Successfully downloaded and parsed game data from S3. Updated at: ${jsonData.updatedAt}`);

            // Update cache
            cachedGameData = jsonData;
            cacheTimestamp = Date.now();
            console.log('Game data cache updated.');

            return jsonData;
        } else {
            console.error('S3 object body is not a readable stream.');
            return null;
        }

    } catch (error) {
        console.error(`Error fetching game data from S3:`, error);
        return null; // エラー時はnullを返す
    }
}


export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const difficultyParam = searchParams.get('difficulty');

    // 難易度パラメータの検証
    if (!difficultyParam || !VALID_DIFFICULTIES.includes(difficultyParam as Difficulty)) {
        return NextResponse.json(
            { error: `Invalid or missing difficulty parameter. Valid options are: ${VALID_DIFFICULTIES.join(', ')}.` },
            { status: 400 }
        );
    }

    const difficulty = difficultyParam as Difficulty;
    const now = Date.now();
    let gameData: GameData | null = null;

    // --- Cache Check ---
    if (cachedGameData && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION_MS)) {
        console.log('Using cached game data.');
        gameData = cachedGameData;
    } else {
        console.log('Cache invalid or expired. Fetching from S3...');
        gameData = await fetchAndCacheGameDataFromS3(); // Fetch and update cache
    }
    // -------------------

    try {
        // Use fetched or cached data
        if (!gameData || !gameData.ids) {
            console.error('Failed to retrieve valid game data (from cache or S3).');
            // If fetch failed previously, cache might be null.
            return NextResponse.json({ error: 'Failed to retrieve game data.' }, { status: 500 });
        }

        let combinedGameIds: string[] = [];

        // 難易度に応じてIDを結合
        if (difficulty === 'easy') {
            combinedGameIds = gameData.ids.easy || [];
        } else if (difficulty === 'normal') {
            combinedGameIds = [...(gameData.ids.easy || []), ...(gameData.ids.normal || [])];
        } else if (difficulty === 'hard') {
            combinedGameIds = [...(gameData.ids.easy || []), ...(gameData.ids.normal || []), ...(gameData.ids.hard || [])];
        }

        // 重複を除去 (念のため)
        const uniqueGameIds = [...new Set(combinedGameIds)];

        console.log(`Returning ${uniqueGameIds.length} unique game IDs for difficulty level '${difficulty}' and below.`);
        return NextResponse.json({ gameIds: uniqueGameIds });

    } catch (error) {
        // This catch block might be less likely to be hit now,
        // as errors during S3 fetch are handled within fetchAndCacheGameDataFromS3
        console.error(`Error processing game data for difficulty=${difficulty}:`, error);
        return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
    }
}
