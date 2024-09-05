import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { RunCollectorCallbackHandler } from "langchain/callbacks";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { v4 as uuidv4 } from 'uuid';

const generateFromText = async ({ transcriptions, language, fields, clientID, client }) => {
    const { nova_transcription, whisper_transcription, assembly_ai_transcription, rev_ai_transcription } = transcriptions;
    try {
        if (!!nova_transcription && !!whisper_transcription) {
            const mergingContextResult = await client.query('SELECT * FROM public."constants" WHERE name = $1', ['transcriptionContext']);
            const generationContextResult = await client.query('SELECT * FROM public."constants" WHERE name = $1', ['generationContext']);
            // console.log(">> mergingContextResult.rows[0]: ", mergingContextResult.rows[0]);
            // console.log(">> generationContextResult.rows[0]: ", generationContextResult.rows[0]);

            const mergingContext = mergingContextResult.rows[0].value;
            const generationContext = generationContextResult.rows[0].value;

            const reportTemplateResult = await client.query('SELECT value FROM public."constants" WHERE name = $1', ["structured_report_template"]);
            const reportTemplateResponse = reportTemplateResult.rows[0].value;
            const reportTemplate = reportTemplateResponse.replace("{fields}", fields.join(', '));;

            const mergingPrompt = PromptTemplate.fromTemplate(mergingContext);
            const generationPrompt = PromptTemplate.fromTemplate(generationContext);

            let generationModel, mergingModel;

            const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL;
            const OPENAI_MODEL = process.env.OPENAI_MODEL;

            const mergeConfig = JSON.parse(process.env.MERGE_CONFIG);
            const generationConfig = JSON.parse(process.env.GENERATION_CONFIG);

            const service_name = process.env.SERVICE_NAME;

            if (service_name === 'anthropic') {
                mergeConfig.modelName = ANTHROPIC_MODEL;
                mergingModel = new ChatAnthropic(mergeConfig);

                generationConfig.modelName = ANTHROPIC_MODEL;
                generationModel = new ChatAnthropic(generationConfig);
            } else {
                mergeConfig.modelName = OPENAI_MODEL;
                mergingModel = new ChatOpenAI(mergeConfig);

                generationConfig.modelName = OPENAI_MODEL;
                generationModel = new ChatOpenAI(generationConfig);
            }

            const mergingChain = mergingPrompt.pipe(mergingModel).pipe(new StringOutputParser());
            const generationChain = generationPrompt.pipe(generationModel).pipe(new StringOutputParser());

            const runCollector = new RunCollectorCallbackHandler();

            const combinedChain = RunnableSequence.from([
                {
                    transcription: mergingChain,
                    language: (input) => input.language,
                    template: (input) => input.template,
                },
                generationChain,
            ]);

            const result = await combinedChain.invoke({
                nova_transcription: nova_transcription,
                whisper_transcription: whisper_transcription,
                rev_transcription: rev_ai_transcription,
                assembly_transcription: assembly_ai_transcription,
                language: language,
                template: reportTemplate,
            },
                { callbacks: [runCollector] }
            );

            if (!!result) {
                const runID = runCollector.tracedRuns[0].id;
                const prompt_tokens = runCollector.tracedRuns[0].prompt_tokens;
                const completion_tokens = runCollector.tracedRuns[0].completion_tokens;

                const id = uuidv4();
                const queryResult = client.query(
                    'INSERT INTO public."runs" (id, run_id, client_id, total_prompt_tokens, total_completion_tokens) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                    [id, runID, clientID, prompt_tokens, completion_tokens]
                );
                console.log("queryResult: ", queryResult.rows[0]);

                return result;
            }
        }
    } catch (error) {
        //console.error('Error generating medical report');
        throw error;
    }
}

export async function generateStructuredReport(data) {
    try {
        console.log('\n>>>>>> Generating JSON response <<<<<<');
        const response = await generateFromText(data);

        let content;
        response.startsWith("```json") ? content = response.slice(7, -3) : content = response;

        const structuredReport = JSON.parse(content);

        console.log('Structured report:', structuredReport);
        console.log('\n>>>>>> Respone generated <<<<<<');
        return structuredReport;

    } catch (error) {
        console.error('Error generating structured report');
        throw error;
    }
}