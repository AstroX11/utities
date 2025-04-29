import got, { type Options as gotOps } from 'got';
import { Boom } from '@hapi/boom';
import FormData from 'form-data';

export const fetch = async function (
 url: string,
 options?: gotOps,
): Promise<string> {
 try {
  const data = await got.get(url, {
   headers: {
    'User-Agent':
     'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept:
     'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    Connection: 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    DNT: '1',
    ...options,
   },
   ...options,
  });
  return data.body;
 } catch (error) {
  throw new Boom(error as Error);
 }
};

export const postfetch = async function (
 url: string,
 options?: {
  formData?: Record<string, any>;
  headers?: Record<string, string>;
 },
): Promise<string> {
 try {
  const defaultHeaders = {
   'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
   Accept: 'application/json, text/plain, */*',
   'Accept-Language': 'en-US,en;q=0.5',
   'Accept-Encoding': 'gzip, deflate, br',
   Connection: 'keep-alive',
   'Upgrade-Insecure-Requests': '1',
   DNT: '1',
  };

  const form = new FormData();
  if (options?.formData) {
   for (const [key, value] of Object.entries(options.formData)) {
    form.append(key, value);
   }
  }

  const response = await got.post(url, {
   headers: {
    ...defaultHeaders,
    ...options?.headers,
    ...form.getHeaders(),
   },
   body: form,
   throwHttpErrors: true,
  });

  try {
   return response.body;
  } catch (jsonError) {
   return response.body;
  }
 } catch (error: any) {
  throw new Boom(error.message, {
   statusCode: error.response?.statusCode || 500,
   data: error.response?.body || null,
  });
 }
};

export const urlBuffer = async function (
 url: string,
 options?: gotOps,
): Promise<Buffer> {
 try {
  const data = await got.get(url, {
   headers: {
    'User-Agent':
     'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept:
     'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    Connection: 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    DNT: '1',
    ...options?.headers,
   },
   responseType: 'buffer',
   ...options,
  });
  return data.rawBody;
 } catch (error) {
  throw new Boom(error as Error);
 }
};

export const extractUrl = (str: string): string | false => {
 const match = str.match(/https?:\/\/[^\s]+/);
 return match ? match[0] : false;
};

export function isUrl(text: string): boolean {
 const urlRegex = /\bhttps?:\/\/[^\s/$.?#].[^\s]*|www\.[^\s/$.?#].[^\s]*\b/gi;
 return urlRegex.test(text);
}
