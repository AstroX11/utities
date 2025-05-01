/** Under the permission of
 * https://www.vox.com/robots.txt
 */
export declare function voxnews(): Promise<string>;
/**
 * WaBetaInfo News
 */
export declare const wabetanews: () => Promise<string>;
/**
 * Tech news gizmodo
 */
export declare const technews: () => Promise<string>;
export declare function lyrics(song: string): Promise<{
    artist: string;
    lyrics: string;
    thumbnail: string | undefined;
} | undefined>;
