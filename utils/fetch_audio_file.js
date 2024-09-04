import fetch from 'node-fetch';
import { fileTypeFromBuffer } from 'file-type';

export const fetchAudioFile = async (audio_url) => {
    try {
        console.log('\n>>>>>> Fetching audio file <<<<<<');
        const response = await fetch(audio_url);
        if (!response.ok) {
            throw new Error(`Failed to fetch audio file: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const fileType = await fileTypeFromBuffer(buffer);
        console.log('file type:', fileType);
        if (!fileType || !fileType.mime.startsWith('audio/')) {
            throw new Error('Not a valid audio file.');
        }

        console.log('>>>>>> Audio fetch complete <<<<<<');
        return buffer;
    } catch (error) {
        console.error(`Error fetching audio file`);
        throw error;
    }
};
