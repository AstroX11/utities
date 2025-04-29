import { postfetch } from './fetch.mjs';

export async function chatGpt(query: string) {
 if (!query) throw new Error('No Query Found!');

 const res = await postfetch(
  'https://api.deepai.org/hacking_is_a_serious_crime',
  {
   headers: {
    'api-key': 'tryit-86334100510-5bff4dc1b30845d151163ccbf00306c2',
    'content-type':
     'multipart/form-data; boundary=----WebKitFormBoundary8xxtzH50VmeCqArR',
    accept: '*/*',
    'accept-language': 'en-US,en;q=0.9',
    'accept-encoding': 'gzip, deflate, br, zstd',
    origin: 'https://deepai.org',
    'sec-ch-ua':
     '"Microsoft Edge";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-site',
    cookie: 'user_sees_ads=false',
    priority: 'u=1, i',
   },
   formData: {
    chat_style: 'free-chatgpt',
    chatHistory: JSON.stringify([{ role: 'user', content: query }]),
    model: 'standard',
    hacker_is_stinky: 'very_stinky',
   },
  },
 );

 return res;
}
