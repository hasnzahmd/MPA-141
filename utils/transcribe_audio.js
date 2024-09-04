import { createClient } from "@deepgram/sdk";
import { AssemblyAI } from "assemblyai";
import { RevAiApiClient } from "revai-node-sdk";

const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

const assemblyAiClient = new AssemblyAI({
    apiKey: process.env.ASSEMBLY_AI_API_KEY,
});

var revAiClient = new RevAiApiClient(process.env.REV_AI_API_KEY);

const convertAudioToTranscript = async (audioBuffer, model, language) => {
    try {
        if (model == "nova-2" || model == "whisper-large") {
            const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
                audioBuffer, {
                model,
                language,
                smart_format: true,
                numerals: true,
                dictation: true
            }
            );
            if (error) {
                throw error
            }
            return {
                result: result.results?.channels[0]?.alternatives[0].transcript,
                confidence: result.results?.channels[0]?.alternatives[0]?.confidence,
                model,
            }
        }

        if (model == "assembly_ai") {
            const { text, confidence, error } = await assemblyAiClient.transcripts.transcribe({
                audio: audioBuffer,
                language_code: language,
                format_text: false
            });

            if (error) {
                throw error
            }

            return {
                result: text,
                confidence,
                model,
            }
        }

        if (model == "rev_ai") {
            var job = await revAiClient.submitJobAudioData(audioBuffer, null, {language});
            let jobStatus = await revAiClient.getJobDetails(job.id);
            
            while (jobStatus.status !== 'transcribed') {
                // console.log('Waiting for transcription...');
                await new Promise(resolve => setTimeout(resolve, 1500));
                jobStatus = await revAiClient.getJobDetails(job.id);
            }
            //console.log("Rev AI done waiting. jobStatus.status: ", jobStatus.status)
            const text = await revAiClient.getTranscriptText(job.id);
            return {
                result: text,
                confidence: 0,
                model,
            }
        }

    } catch (error) {
        console.error('Error converting audio to text');
        throw error;
    }
}

export const transcribeAudio = async (audioBuffer, language) => {
    console.log('\n>>>>>> Generating transcripts from audio <<<<<<');
    try {
        const [
            nova_transcription,
            whisper_transcription,
            assembly_ai_transcription,
            rev_ai_transcription
        ] = await Promise.all([
            convertAudioToTranscript(audioBuffer, "nova-2", language),
            convertAudioToTranscript(audioBuffer, "whisper-large", language),
            convertAudioToTranscript(audioBuffer, "assembly_ai", language),
            convertAudioToTranscript(audioBuffer, "rev_ai", language)
        ]);
        console.log('>>>>>> Transcripts generation complete <<<<<<');
        const transcriptions = {
            nova_transcription: nova_transcription.result,
            whisper_transcription: whisper_transcription.result,
            assembly_ai_transcription: assembly_ai_transcription.result,
            rev_ai_transcription: rev_ai_transcription.result,
        };
        return transcriptions;

    } catch (error) {
        console.error('Error generating transcript from audio');
        throw error;
    }
}