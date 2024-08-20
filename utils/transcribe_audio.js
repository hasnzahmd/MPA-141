import { createClient } from "@deepgram/sdk";
const deepgram = createClient('c592eb28a418b5a67842162de94bce46703e33c7');
import fs from 'fs';

export const transcribeAudio = async (filePath, model = 'nova', language = 'en') => {
    try {
        console.log('\n>>>>>> Start transcribe audio <<<<<<');
        const audioStream = fs.createReadStream(filePath);

        const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
            audioStream,
            {
                model: model,
                language: language,
                numerals: true,
                dictation: true,
                smart_format: true
            }
        );
        if (error) {
            throw error;
        }
        const transcript = result.results.channels[0].alternatives[0].transcript;
        console.log('Transcript:',transcript); 

        console.log('>>>>>> Complete transcribe audio <<<<<<'); 
        return transcript;

    } catch (error) {
        console.error('Error transcribing audio:', error.message);
        throw error;
    }
}