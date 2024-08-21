import OpenAI from "openai";
import { generationContext, input } from "./constants.js";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export async function generateStructuredReport(transcript, fields) {
    try {
        console.log('\n>>>>>> Generating JSON response <<<<<<');
        const formattedPrompt = input
            .replace('{transcription}', transcript)
            .replace('{fields}', fields.join(', '))

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: generationContext },
                { role: "user", content: formattedPrompt }
            ],
            temperature: 0,
        });
        console.log('Response message content:', response.choices[0].message.content);

        let cleanedContent = response.choices[0].message.content.trim();

        if (cleanedContent.startsWith("```json")) {
            cleanedContent = cleanedContent.slice(7, -3).trim();
        }

        let structuredReport;
        try {
            structuredReport = JSON.parse(cleanedContent);
        } catch (error) {
            throw error;
        }

        console.log('Structured report:', structuredReport);
        console.log('\n>>>>>> Respone generated <<<<<<');
        return structuredReport;

    } catch (error) {
        console.error('Error generating structured report');
        throw error;
    }
}