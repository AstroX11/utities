import fs from 'fs';
import path from 'path';
import os, { tmpdir } from 'os';
import sharp from 'sharp';
import { exec } from 'child_process';
import { promisify } from 'util';
import Crypto from 'crypto';
import webp from 'node-webpmux';
import { fileTypeFromBuffer } from 'file-type';
const execAsync = promisify(exec);
const { writeFileSync, existsSync, readFileSync, mkdirSync } = fs;
const tempDir = path.join(os.tmpdir(), 'media-temp');
if (!existsSync(tempDir))
    mkdirSync(tempDir, { recursive: true });
function temp(ext) {
    return path.join(tempDir, `${Date.now()}.${ext}`);
}
async function saveInputFile(buffer) {
    const fileType = await fileTypeFromBuffer(buffer);
    if (!fileType)
        throw new Error('Unknown file type');
    const inputPath = temp(fileType.ext);
    writeFileSync(inputPath, buffer);
    return inputPath;
}
export const GIFBufferToVideoBuffer = async (image) => {
    const gifPath = temp('gif');
    const mp4Path = temp('mp4');
    writeFileSync(gifPath, image);
    try {
        await execAsync(`ffmpeg -i "${gifPath}" -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -f mp4 "${mp4Path}"`);
        const buffer = readFileSync(mp4Path);
        fs.unlinkSync(mp4Path);
        fs.unlinkSync(gifPath);
        return buffer;
    }
    catch (error) {
        if (existsSync(mp4Path))
            fs.unlinkSync(mp4Path);
        if (existsSync(gifPath))
            fs.unlinkSync(gifPath);
        throw error;
    }
};
export async function audioToBlackVideo(input) {
    const inputFile = await saveInputFile(input);
    const video = temp('mp4');
    try {
        await execAsync(`ffmpeg -f lavfi -i "color=black:s=1920x1080:r=30" -i "${inputFile}" -c:v libx264 -preset ultrafast -crf 23 -c:a aac -b:a 128k -map 0:v -map 1:a -shortest "${video}"`);
        const buffer = readFileSync(video);
        fs.unlinkSync(video);
        fs.unlinkSync(inputFile);
        return buffer;
    }
    catch (error) {
        if (existsSync(video))
            fs.unlinkSync(video);
        if (existsSync(inputFile))
            fs.unlinkSync(inputFile);
        throw error;
    }
}
export async function flipMedia(input, direction) {
    const inputFile = await saveInputFile(input);
    const fileType = await fileTypeFromBuffer(input);
    const outputFile = temp(fileType?.ext);
    const validDirections = {
        left: 'transpose=2',
        right: 'transpose=1',
        vertical: 'vflip',
        horizontal: 'hflip',
    };
    try {
        await execAsync(`ffmpeg -i "${inputFile}" -vf "${validDirections[direction]}" "${outputFile}"`);
        const buffer = readFileSync(outputFile);
        fs.unlinkSync(outputFile);
        fs.unlinkSync(inputFile);
        return buffer;
    }
    catch (error) {
        if (existsSync(outputFile))
            fs.unlinkSync(outputFile);
        if (existsSync(inputFile))
            fs.unlinkSync(inputFile);
        throw error;
    }
}
export async function webpToImage(input) {
    const inputFile = temp('webp');
    const outputImage = temp('jpg');
    writeFileSync(inputFile, input);
    try {
        await execAsync(`ffmpeg -i "${inputFile}" "${outputImage}"`);
        const buffer = readFileSync(outputImage);
        fs.unlinkSync(outputImage);
        fs.unlinkSync(inputFile);
        return buffer;
    }
    catch (error) {
        if (existsSync(outputImage))
            fs.unlinkSync(outputImage);
        if (existsSync(inputFile))
            fs.unlinkSync(inputFile);
        throw error;
    }
}
export async function convertToMp3(input) {
    const inputFile = await saveInputFile(input);
    const outputAudio = temp('mp3');
    try {
        await execAsync(`ffmpeg -i "${inputFile}" -c:a libmp3lame -b:a 192k "${outputAudio}"`);
        const buffer = readFileSync(outputAudio);
        fs.unlinkSync(outputAudio);
        fs.unlinkSync(inputFile);
        return buffer;
    }
    catch (error) {
        if (existsSync(outputAudio))
            fs.unlinkSync(outputAudio);
        if (existsSync(inputFile))
            fs.unlinkSync(inputFile);
        throw error;
    }
}
export async function toPTT(input) {
    const inputFile = await saveInputFile(input);
    const outputAudio = temp('opus');
    try {
        await execAsync(`ffmpeg -i "${inputFile}" -c:a libopus -ac 1 -ar 48000 -b:a 128k -application voip "${outputAudio}"`);
        const buffer = readFileSync(outputAudio);
        fs.unlinkSync(outputAudio);
        fs.unlinkSync(inputFile);
        return buffer;
    }
    catch (error) {
        if (existsSync(outputAudio))
            fs.unlinkSync(outputAudio);
        if (existsSync(inputFile))
            fs.unlinkSync(inputFile);
        throw error;
    }
}
export async function toVideo(input) {
    const inputFile = await saveInputFile(input);
    const outputVideo = temp('mp4');
    try {
        await execAsync(`ffmpeg -i "${inputFile}" -c:v libx264 -crf 32 -preset slow -c:a aac -b:a 128k -ar 44100 "${outputVideo}"`);
        const buffer = readFileSync(outputVideo);
        fs.unlinkSync(outputVideo);
        fs.unlinkSync(inputFile);
        return buffer;
    }
    catch (error) {
        if (existsSync(outputVideo))
            fs.unlinkSync(outputVideo);
        if (existsSync(inputFile))
            fs.unlinkSync(inputFile);
        throw error;
    }
}
export const cropToCircle = async (input) => {
    try {
        const image = sharp(input);
        const { width, height } = await image.metadata();
        const circleMask = Buffer.from(`<svg width="${width}" height="${height}">
		<circle cx="${width / 2}" cy="${height / 2}" r="${Math.min(width, height) / 2}" fill="white"/>
	  </svg>`);
        const croppedImage = await image
            .composite([{ input: circleMask, blend: 'dest-in' }])
            .toFormat('webp', { quality: 50 })
            .toBuffer();
        return croppedImage;
    }
    catch (error) {
        console.error('Error cropping image to circle:', error);
        throw error;
    }
};
export const isAnimatedWebp = (filePath) => {
    return new Promise((resolve, reject) => {
        sharp(filePath)
            .metadata()
            .then((metadata) => {
            resolve(metadata?.pages > 1); // If pages > 1, it's animated
        })
            .catch((error) => {
            reject(error);
        });
    });
};
export async function convertWebPFile(media) {
    try {
        const tempDir = path.join('temp_frames');
        const tempOutput = path.join(tempDir, 'output.webm');
        await fs.promises.mkdir(tempDir, { recursive: true });
        const metadata = await sharp(media).metadata();
        if (!metadata.pages)
            throw new Error('Input file is not an animated WebP');
        const fps = metadata.delay ? 1000 / metadata.delay[0] : 15;
        for (let i = 0; i < metadata.pages; i++) {
            const frame = await sharp(media, { page: i }).png().toBuffer();
            await fs.promises.writeFile(path.join(tempDir, `frame_${String(i).padStart(5, '0')}.png`), frame);
        }
        const ffmpegCommand = `ffmpeg -r ${fps} -i "${path.join(tempDir, 'frame_%05d.png')}" \
        -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 500k -y "${tempOutput}"`;
        await execAsync(ffmpegCommand);
        const buffer = await fs.promises.readFile(tempOutput);
        await fs.promises.rm(tempDir, { recursive: true });
        return buffer;
    }
    catch (error) {
        try {
            await fs.promises.rm('temp_frames', { recursive: true, force: true });
        }
        catch (cleanupError) {
            console.error('Error during cleanup:', cleanupError);
        }
        console.error('Error during conversion:', error);
        throw error;
    }
}
async function imageToWebp(media) {
    const tmpFileOut = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);
    const tmpFileIn = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.jpg`);
    fs.writeFileSync(tmpFileIn, media);
    const ffmpegCommand = `ffmpeg -i "${tmpFileIn}" -vf "scale=512:512:force_original_aspect_ratio=decrease" -c:v libwebp -quality 60 "${tmpFileOut}"`;
    try {
        const { stderr } = await execAsync(ffmpegCommand);
        if (stderr)
            console.error('FFmpeg stderr:', stderr);
        const buff = fs.readFileSync(tmpFileOut);
        fs.unlinkSync(tmpFileOut);
        fs.unlinkSync(tmpFileIn);
        return buff;
    }
    catch (error) {
        if (fs.existsSync(tmpFileIn))
            fs.unlinkSync(tmpFileIn);
        if (fs.existsSync(tmpFileOut))
            fs.unlinkSync(tmpFileOut);
        throw new Error(`FFmpeg conversion failed: ${error.message}`);
    }
}
async function videoToWebp(media) {
    const tmpFileOut = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);
    const tmpFileIn = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.mp4`);
    fs.writeFileSync(tmpFileIn, media);
    const ffmpegCommand = `ffmpeg -i "${tmpFileIn}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000,fps=15" -c:v libwebp -loop 0 -preset default -t 00:00:10 -q:v 40 -fs 500k -pix_fmt yuva420p "${tmpFileOut}"`;
    try {
        const { stderr } = await execAsync(ffmpegCommand);
        if (stderr)
            console.error('FFmpeg stderr:', stderr);
        const buff = fs.readFileSync(tmpFileOut);
        fs.unlinkSync(tmpFileOut);
        fs.unlinkSync(tmpFileIn);
        return buff;
    }
    catch (error) {
        if (fs.existsSync(tmpFileIn))
            fs.unlinkSync(tmpFileIn);
        if (fs.existsSync(tmpFileOut))
            fs.unlinkSync(tmpFileOut);
        throw new Error(`FFmpeg conversion failed: ${error.message}`);
    }
}
async function writeExifImg(media, metadata = {}) {
    const wMedia = await imageToWebp(media);
    const tmpFileIn = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);
    const tmpFileOut = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);
    try {
        fs.writeFileSync(tmpFileIn, wMedia);
        const img = new webp.Image();
        await img.load(tmpFileIn);
        if (metadata.packname || metadata.author) {
            const json = {
                'sticker-pack-id': `https://github.com/AstroX11/Xstro`,
                'sticker-pack-name': metadata.packname,
                'sticker-pack-publisher': metadata.author,
                emojis: metadata.categories ? metadata.categories : [''],
            };
            const exifAttr = Buffer.from([
                0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00,
            ]);
            const jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8');
            const exif = Buffer.concat([exifAttr, jsonBuff]);
            exif.writeUIntLE(jsonBuff.length, 14, 4);
            img.exif = exif;
        }
        await img.save(tmpFileOut);
        const buff = fs.readFileSync(tmpFileOut);
        fs.unlinkSync(tmpFileOut);
        fs.unlinkSync(tmpFileIn);
        return buff;
    }
    catch (error) {
        if (fs.existsSync(tmpFileIn))
            fs.unlinkSync(tmpFileIn);
        if (fs.existsSync(tmpFileOut))
            fs.unlinkSync(tmpFileOut);
        throw error;
    }
}
async function writeExifVid(media, metadata = {}) {
    const wMedia = await videoToWebp(media);
    const tmpFileIn = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);
    const tmpFileOut = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);
    try {
        fs.writeFileSync(tmpFileIn, wMedia);
        const img = new webp.Image();
        await img.load(tmpFileIn);
        if (metadata.packname || metadata.author) {
            const json = {
                'sticker-pack-id': `https://github.com/AstroX11/Xstro`,
                'sticker-pack-name': metadata.packname,
                'sticker-pack-publisher': metadata.author,
                emojis: metadata.categories ? metadata.categories : [''],
            };
            const exifAttr = Buffer.from([
                0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00,
            ]);
            const jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8');
            const exif = Buffer.concat([exifAttr, jsonBuff]);
            exif.writeUIntLE(jsonBuff.length, 14, 4);
            img.exif = exif;
        }
        await img.save(tmpFileOut);
        const buff = fs.readFileSync(tmpFileOut);
        fs.unlinkSync(tmpFileOut);
        fs.unlinkSync(tmpFileIn);
        return buff;
    }
    catch (error) {
        if (fs.existsSync(tmpFileIn))
            fs.unlinkSync(tmpFileIn);
        if (fs.existsSync(tmpFileOut))
            fs.unlinkSync(tmpFileOut);
        throw error;
    }
}
export const createSticker = async (buffer, author, packname) => {
    const mime = await fileTypeFromBuffer(buffer);
    let res;
    const options = {
        packname: packname || 'Xstro',
        author: author || 'Astro',
    };
    if ((await fileTypeFromBuffer(buffer))?.mime !== 'video/mp4' && (await isAnimatedWebp(buffer))) {
        const media = await convertWebPFile(buffer);
        return await writeExifVid(media, options);
    }
    try {
        if (mime?.mime.startsWith('image/')) {
            res = await writeExifImg(buffer, options);
        }
        else if (mime?.mime.startsWith('video/')) {
            res = await writeExifVid(buffer, options);
        }
        else {
            throw new Error('Only images and videos are supported');
        }
        return res;
    }
    catch (error) {
        console.error('Sticker creation error:', error);
        throw new Error(`Sticker creation failed: ${error.message}`);
    }
};
export async function trimVideo(input, startTime, endTime) {
    const inputFile = await saveInputFile(input);
    const outputVideo = temp('mp4');
    try {
        // The -ss parameter specifies the start time
        // The -to parameter specifies the end time
        // Using these parameters before -i would be faster (seeking) but less accurate
        // Using them after -i is slower but more accurate for frame-exact cutting
        await execAsync(`ffmpeg -i "${inputFile}" -ss ${startTime} -to ${endTime} -c:v libx264 -c:a aac -strict experimental -b:a 128k "${outputVideo}"`);
        const buffer = readFileSync(outputVideo);
        fs.unlinkSync(outputVideo);
        fs.unlinkSync(inputFile);
        return buffer;
    }
    catch (error) {
        if (existsSync(outputVideo))
            fs.unlinkSync(outputVideo);
        if (existsSync(inputFile))
            fs.unlinkSync(inputFile);
        throw error;
    }
}
