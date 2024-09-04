# Audio to Structured Medical Report API

## Overview

This project provides an API for generating structured medical reports from audio files. The API transcribes the audio and organizes the content into the requested report sections.

## Features

- Transcribe audio from a provided URL in the specified language.
- Structure transcription into requested medical report sections.
- Return a JSON object with the requested fields and any additional content in an "other" field.
- Support for specifying the desired language for the output report.

## API Specification

### Endpoint

**POST** `/generate-medical-report`

### Request

Body:

```json
{
"audio_url": "<https://example.com/audio/doctor_notes.mp3>",
"fields": ["diagnosis", "findings", "medication", "procedure", "recipes", "therapy"],
},
```

Params:

```json
{
"audio_language": "en",
"report_language": "spanish"
}
```

### Process

1. Receive: The API receives the audio_url, fields, audio_language, and report_language from the POST request.
2. Transcribe: The audio is transcribed into text.
3. Structure: The transcription is organized into the requested medical report sections.
4. Return: The structured data is returned in a JSON object with requested fields and an "other" section for unspecified content.

### Technologies Used

1. Node.js: Backend runtime environment.
2. Express: Web framework for handling API requests.
3. Deepgram, Rev AI, and Assembly AI for converting audio to text.
4. LangChain, Anthropic AI, and OpenAI for report creation.
