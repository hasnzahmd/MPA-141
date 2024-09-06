import express from 'express';
import { fetchAudioFile } from '../utils/fetch_audio_file.js';
import { transcribeAudio } from '../utils/transcribe_audio.js';
import { generateStructuredReport } from '../utils/generate_report.js';
import { getCredentials } from '../utils/get_credentials.js';

export const reportRouter = express.Router();

reportRouter.post('/', async (req, res) => {
    const { audio_url, fields, audio_language, report_language } = req.body;
    const apiKey = req.headers['x-api-key'];

    const { pool } = await getCredentials();
    let client = await pool.connect();
    console.log("client connected");

    const apiKeyResult = await client.query('SELECT * FROM public."clients" WHERE api_key = $1', [apiKey]);
    if (apiKeyResult.rows.length === 0) {
        return {
            statusCode: 403,
            body: JSON.stringify({ error: 'Forbidden: Invalid API Key' }),
        };
    }
    const { id: clientID, api_key } = apiKeyResult.rows[0];
    console.log('Valid apiKey:', api_key);

    try {
        const audioBuffer = await fetchAudioFile(audio_url);
        const transcriptions = await transcribeAudio(audioBuffer, audio_language);
        const structuredReport = await generateStructuredReport({transcriptions, report_language, fields, clientID, client});

        res.status(200).json({structuredReport});
    } catch (error) {
        console.error('Error generating medical report:', error.message);
        res.status(500).json({ error: `Error generating medical report: ${error.message}` });
    }
});