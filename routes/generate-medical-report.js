import express from 'express';
import { fetchAudioFile } from '../utils/fetch_audio_file.js';
import { transcribeAudio } from '../utils/transcribe_audio.js';
import { generateStructuredReport } from '../utils/generate_report.js';

export const reportRouter = express.Router();

reportRouter.post('/', async (req, res) => {
    const { audio_url, fields } = req.body;

    try {
        const audioBuffer = await fetchAudioFile(audio_url);
        const {transcriptions, detected_language: language} = await transcribeAudio(audioBuffer);
        const structuredReport = await generateStructuredReport(transcriptions, language, fields);

        res.status(200).json(structuredReport);
    } catch (error) {
        console.error('Error generating medical report:', error.message);
        res.status(500).json({ error: `Error generating medical report: ${error.message}` });
    }
});