import pg from 'pg';
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { RunCollectorCallbackHandler } from "langchain/callbacks";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
//import { Sentry } from "@sentry/serverless";

let pool;

const getCredentials = async () => {
    const secret_name = process.env.RDS_SECRET;
    // const sentry_secret_name = process.env.SENTRY_SECRET;

    const client = new SecretsManagerClient({
        region: "eu-central-1",
    });
    let response;
    try {
        response = await client.send(
            new GetSecretValueCommand({
                SecretId: secret_name,
                VersionStage: "AWSCURRENT",
            })
        );

        // const sentry_response = await client.send(
        //     new GetSecretValueCommand({
        //         SecretId: sentry_secret_name,
        //         VersionStage: "AWSCURRENT", // VersionStage defaults to AWSCURRENT if unspecified
        //     })
        // );

        const respObj = JSON.parse(response.SecretString);
        // const sentryRespObj = JSON.parse(sentry_response.SecretString);

        // Sentry.AWSLambda.init({
        //     dsn: sentryRespObj.sentry_dsn_key,
        //     tracesSampleRate: 1.0,
        // });

        // console.log("sentry response obj ", sentryRespObj);

        const connectObj = {
            user: respObj.username,
            host: 'localhost',
            database: respObj.dbname,
            password: respObj.password,
            port: 5433,
            ssl: process.env.STAGE === "production",
        };
        pool = new pg.Pool(connectObj);
        console.log("pool created");
        return connectObj;
    } catch (error) {
        console.log("secrete manager error ", error);
        throw error;
    }
};

let client;

const generateFromText = async (transcriptions, language, fields) => {
    const { nova_transcription, whisper_transcription, assembly_ai_transcription, rev_ai_transcription } = transcriptions;
    try {
        client = await pool.connect();
        console.log("client connected")

        if(!!nova_transcription && !! whisper_transcription) {
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

            if(!!result) {
                //const runID = runCollector.tracedRuns[0].id;
                return result;
            }
        }
    } catch (error) {
        //console.error('Error generating medical report');
        throw error;
    }
}

export async function generateStructuredReport(transcriptions, language, fields) {
    try {
        console.log('\n>>>>>> Generating JSON response <<<<<<');
        await getCredentials();
        const response = await generateFromText(transcriptions, language, fields);

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