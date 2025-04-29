import { type Options as gotOps } from 'got';
export declare const fetch: (url: string, options?: gotOps) => Promise<string>;
export declare const postfetch: (url: string, options?: {
    formData?: Record<string, any>;
    headers?: Record<string, string>;
}) => Promise<string>;
export declare const urlBuffer: (url: string, options?: gotOps) => Promise<Buffer>;
export declare const extractUrl: (str: string) => string | false;
export declare function isUrl(text: string): boolean;
