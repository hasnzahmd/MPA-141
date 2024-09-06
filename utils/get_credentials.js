import pg from 'pg';
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
//import { Sentry } from "@sentry/serverless";

export const getCredentials = async () => {
    let pool;
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
        return {connectObj, pool};
    } catch (error) {
        console.log("secrete manager error ", error);
        throw error;
    }
};