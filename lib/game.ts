import { Boardgame } from "@/types/boardgame";

// レーティング値を取得 (Boardgame 型に合わせて修正)
export const getRatingValue = (item: Boardgame | undefined, key: 'average' | 'usersrated' | 'bayesaverage'): string => {
    return item?.statistics?.ratings?.[key] || 'N/A';
};

  // ゲーム名を取得 (Boardgame 型に合わせて修正)
export const getGameName = (item: Boardgame | undefined): string => {
    const primaryName = item?.name?.find(n => n.type === 'primary');
    return primaryName?.value || 'Unknown Game';
};