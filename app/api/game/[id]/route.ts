import { Boardgame } from '@/types/boardgame';
import { NextResponse } from 'next/server'
import { parseStringPromise } from 'xml2js';

export const dynamic = 'force-dynamic'; // Next.js データキャッシュを無効化

export async function GET(
    _: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    try {
        // BGG APIへのfetch呼び出しでキャッシュを無効化
        const res = await fetch(`${process.env.NEXT_PUBLIC_BGG_API_URL}/thing?id=${id}&stats=1`, { 
            cache: 'no-store' 
        });
        
        if (!res.ok) {
            // 404 Not Found は許容する（BGG API が見つけられない場合があるため）
            if (res.status === 404) {
                console.warn(`Game data not found for ID ${id} (404) from BGG API`);
                return NextResponse.json({ error: `Game not found (404) for ID: ${id}` }, { status: 404 });
            }
            throw new Error(`Failed to fetch data from BGG API: ${res.status} ${res.statusText}`);
        }

        const xmlData = await res.text();
        // xml2jsで変換
        const parsedData = await parseStringPromise(xmlData);
        // 現在のBoardgame型に合わせてデータを整形
        const formattedData = transformToBoardgameType(parsedData);
        
        return NextResponse.json(formattedData);
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal Server Error:' + error },
            { status: 500 }
        )
    }
}

interface Xml2JsOutput {
    items: {
        item: Array<{
            $: { type: string; id: string };
            thumbnail?: Array<string>;
            image?: Array<string>;
            name?: Array<{ $: { type: string; value: string } }>;
            description?: Array<string>;
            yearpublished?: Array<{ $: { value: string } }>;
            minplayers?: Array<{ $: { value: string } }>;
            maxplayers?: Array<{ $: { value: string } }>;
            playingtime?: Array<{ $: { value: string } }>;
            minplaytime?: Array<{ $: { value: string } }>;
            maxplaytime?: Array<{ $: { value: string } }>;
            minage?: Array<{ $: { value: string } }>;
            link?: Array<{ $: { type: string; id: string; value: string; inbound?: string } }>;
            statistics?: Array<{
            ratings?: Array<{
                usersrated?: Array<{ $: { value: string } }>;
                average?: Array<{ $: { value: string } }>;
                bayesaverage?: Array<{ $: { value: string } }>;
                stddev?: Array<{ $: { value: string } }>;
                median?: Array<{ $: { value: string } }>;
                owned?: Array<{ $: { value: string } }>;
                trading?: Array<{ $: { value: string } }>;
                wanting?: Array<{ $: { value: string } }>;
                wishing?: Array<{ $: { value: string } }>;
                numcomments?: Array<{ $: { value: string } }>;
                numweights?: Array<{ $: { value: string } }>;
                averageweight?: Array<{ $: { value: string } }>;
            }>;
            }>;
        }>;
    };
}

// 変換ヘルパー関数
function transformToBoardgameType(data: Xml2JsOutput): Boardgame {
    const item = data.items.item[0];
    
    return {
        type: item.$.type,
        id: item.$.id,
        thumbnail: item.thumbnail?.[0],
        image: item.image?.[0],
        name: item.name?.map((n) => ({
            type: n.$.type,
            value: n.$.value
        })),
        description: item.description?.[0],
        yearpublished: item.yearpublished?.[0]?.$.value,
        statistics: {
            ratings: {
                usersrated: item.statistics?.[0]?.ratings?.[0]?.usersrated?.[0]?.$.value,
                average: item.statistics?.[0]?.ratings?.[0]?.average?.[0]?.$.value,
                bayesaverage: item.statistics?.[0]?.ratings?.[0]?.bayesaverage?.[0]?.$.value,
                stddev: item.statistics?.[0]?.ratings?.[0]?.stddev?.[0]?.$.value,
                median: item.statistics?.[0]?.ratings?.[0]?.median?.[0]?.$.value,
                owned: item.statistics?.[0]?.ratings?.[0]?.owned?.[0]?.$.value,
                trading: item.statistics?.[0]?.ratings?.[0]?.trading?.[0]?.$.value,
                wanting: item.statistics?.[0]?.ratings?.[0]?.wanting?.[0]?.$.value,
                wishing: item.statistics?.[0]?.ratings?.[0]?.wishing?.[0]?.$.value,
                numcomments: item.statistics?.[0]?.ratings?.[0]?.numcomments?.[0]?.$.value,
                numweights: item.statistics?.[0]?.ratings?.[0]?.numweights?.[0]?.$.value,
                averageweight: item.statistics?.[0]?.ratings?.[0]?.averageweight?.[0]?.$.value
            }
        }
    };
}
