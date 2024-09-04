import express from 'express';
import { fetchAudioFile } from '../utils/fetch_audio_file.js';
import { transcribeAudio } from '../utils/transcribe_audio.js';
import { generateStructuredReport } from '../utils/generate_report.js';

export const reportRouter = express.Router();

reportRouter.post('/', async (req, res) => {
    const { audio_url, fields } = req.body;
    const { audio_language, report_language } = req.query;
    console.log('Audio language', audio_language);
    console.log('Report language', report_language);

    try {
        const audioBuffer = await fetchAudioFile(audio_url);
        const transcriptions = await transcribeAudio(audioBuffer, audio_language);
        const structuredReport = await generateStructuredReport(transcriptions, report_language, fields);

        res.status(200).json(structuredReport);
    } catch (error) {
        console.error('Error generating medical report:', error.message);
        res.status(500).json({ error: `Error generating medical report: ${error.message}` });
    }
});