import express from 'express';
import { fetchAudioFile } from '../utils/fetch_audio_file.js';
import { transcribeAudio } from '../utils/transcribe_audio.js';

export const reportRouter = express.Router();

reportRouter.post('/', async (req, res) => {
    const { audio_url, fields } = req.body;

    try {
        const audioFilePath = await fetchAudioFile(audio_url); 
        const transcript = await transcribeAudio(audioFilePath);

        //const structuredReport = await generateStructuredReport(transcript, fields);

        res.status(200).json({
            message: 'success',
            audioFilePath,
            transcript,
        });
    } catch (error) {
        console.error('Error generating medical report:', error.message);
        res.status(500).json({ error: `Error generating medical report: ${error.message}` });
    }
});