import * as cheerio from 'cheerio';
import { Boom } from '@hapi/boom';
import { fetch } from './fetch.mjs';

/** Under the permission of
 * https://www.vox.com/robots.txt
 */
export async function voxnews(): Promise<string> {
 try {
  const html = await fetch('https://www.vox.com/');
  const $ = cheerio.load(html);
  const newsItems: { title: string; url: string }[] = [];
  const seenTitles = new Set<string>();
  const seenUrls = new Set<string>();

  $('a.qcd9z1.hd0te9s').each((i, element: any) => {
   const $element = $(element);
   const title = $element.text().trim();
   const url = $element.attr('href');
   const absoluteUrl = url
    ? url.startsWith('http')
      ? url
      : `https://www.vox.com${url}`
    : '';
   if (
    title &&
    absoluteUrl &&
    !seenTitles.has(title) &&
    !seenUrls.has(absoluteUrl)
   ) {
    newsItems.push({ title, url: absoluteUrl });
    seenTitles.add(title);
    seenUrls.add(absoluteUrl);
   }
  });

  return newsItems.map((data) => `${data.title}\n${data.url}\n`).join('\n');
 } catch (error) {
  throw new Boom(error as Error);
 }
}

/**
 * WaBetaInfo News
 */
export const wabetanews = async (): Promise<string> => {
 try {
  const html = await fetch('https://wabetainfo.com/');
  const $ = cheerio.load(html);
  const articles: { title: string; description: string; link: string }[] = [];

  $('h2.entry-title.mb-half-gutter.last\\:mb-0').each((i, element: any) => {
   const $element = $(element);
   const title = $element.find('a.link').text().trim();
   const link = $element.find('a.link').attr('href') || '';
   const description = $element
    .parent()
    .find('div.entry-excerpt.mb-gutter.last\\:mb-0')
    .text()
    .trim();

   articles.push({
    title,
    description,
    link,
   });
  });

  return articles
   .map((data) => `${data.title}\n\n${data.description}\n\n${data.link}\n\n`)
   .join('\n');
 } catch (error) {
  throw new Boom(error as Error);
 }
};

/**
 * Tech news gizmodo
 */
export const technews = async (): Promise<string> => {
 interface NewsItem {
  title: string;
  description: string;
  postLink: string;
 }

 try {
  const html: string = await fetch('https://gizmodo.com/tech');
  const $ = cheerio.load(html);
  const newsItems: NewsItem[] = [];

  $('a.block').each((index: number, element: any) => {
   const $article = $(element);
   const title: string = $article.find('h2.font-bold').text().trim();
   const description: string = $article.find('p.font-serif').text().trim();
   const postLink: string = $article.attr('href') || '';

   const newsItem: NewsItem = {
    title,
    description,
    postLink,
   };

   if (title && description && postLink) {
    newsItems.push(newsItem);
   }
  });

  return newsItems
   .map(
    (posts: NewsItem) =>
     `${posts.title}\n${posts.description}\n${posts.postLink}\n`,
   )
   .join('\n');
 } catch (error) {
  throw new Error(error instanceof Error ? error.message : String(error));
 }
};
export async function lyrics(
 song: string,
): Promise<
 { artist: string; lyrics: string; thumbnail: string | undefined } | undefined
> {
 const searchUrl = `https://www.lyrics.com/lyrics/${encodeURIComponent(song)}`;

 let searchHtml: string;
 try {
  searchHtml = await fetch(searchUrl);
 } catch {
  return undefined;
 }

 const $search = cheerio.load(searchHtml);
 const artist = $search('.sec-lyric .lyric-meta-album-artist a')
  .first()
  .text()
  .trim();
 const lyrics = $search('.sec-lyric .lyric-body').first().text().trim();
 const thumbnail =
  $search('.sec-lyric .album-thumb img').first().attr('src') || undefined;

 if (!artist || !lyrics) {
  return undefined;
 }

 return { artist, lyrics, thumbnail };
}
