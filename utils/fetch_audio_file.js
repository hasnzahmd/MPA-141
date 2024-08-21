import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';
import os from 'os';
import { fileTypeFromStream } from 'file-type';

export const fetchAudioFile = async (audio_url) => {
    try {
        console.log('\n>>>>>> Downloading audio file <<<<<<');
        const response = await fetch(audio_url);
        if (!response.ok) {
            throw new Error(`Failed to fetch audio file: ${response.statusText}`);
        }

        const fileType = await fileTypeFromStream(response.body);
        console.log('file type:', fileType);
        if (!fileType || !fileType.mime.startsWith('audio/')) {
            throw new Error('Not a valid audio file.');
        }

        const audioFileName = `${uuidv4()}.${fileType.ext}`;
        const audioFilePath = path.join(os.tmpdir(), audioFileName);

        await new Promise((resolve, reject) => {
            const fileStream = fs.createWriteStream(audioFilePath);
            response.body.pipe(fileStream);
            response.body.on('error', reject);
            fileStream.on('finish', resolve);
        });
        console.log('File path:', audioFilePath);
        console.log('>>>>>> Download complete <<<<<<');
        return audioFilePath;
    } catch (error) {
        console.error(`Error fetching audio file`);
        throw error;
    }
};
