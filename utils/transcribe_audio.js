import { createClient } from "@deepgram/sdk";
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

export const transcribeAudio = async (audioBuffer) => {
    try {
        console.log('\n>>>>>> Start transcribe audio <<<<<<');
        const model = 'nova-2';

        const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
            audioBuffer,
            {
                model: model,
                detect_language: true,
                numerals: true,
                dictation: true,
                smart_format: true
            }
        );
        if (error) {
            throw error;
        }
        const transcript = result.results.channels[0].alternatives[0].transcript;
        const language = result.results.channels[0].detected_language;
        const languageConfidence = result.results.channels[0].language_confidence;
        console.log('Audio language:', language);
        console.log('Language confidence:', languageConfidence);
        console.log('Transcript:', transcript);

        console.log('>>>>>> Complete transcribe audio <<<<<<');
        return transcript;

    } catch (error) {
        console.error('Error transcribing audio');
        throw error;
    }
}