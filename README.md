# Audio to Structured Medical Report API

## Overview

This project provides an API for generating structured medical reports from audio files. The API transcribes the audio and organizes the content into specified report sections.

## Features

- Transcribe audio from a provided URL.
- Structure transcription into requested medical report sections.
- Return a JSON object with the requested fields and any additional content in an "other" field.

## API Specification

### Endpoint

**POST** `/generate-medical-report`

### Request

```json
{
 "audio_url": "<https://example.com/audio/doctor_notes.mp3>",
 "fields": ["diagnosis", "findings", "medication", "procedure", "recipes", "therapy"]
}
```

### Response

```json
{
 "diagnosis": "Diagnosis content here...",
 "findings": "Findings content here...",
 "medication": "Medication content here...",
 "procedure": "Procedure content here...",
 "recipes": "Recipes content here...",
 "therapy": "Therapy content here...",
 "other": "Additional unspecified content goes here as a single text field."
}
```

### Process

1. Receive: The API receives the audio_url and fields from the POST request.
2. Transcribe: The audio is transcribed into text.
3. Structure: The transcription is organized into the requested medical report sections.
4. Return: The structured data is returned in a JSON object with requested fields and an "other" section for unspecified content.

### Technologies Used

1. Node.js: Backend runtime environment.
2. Express: Web framework for handling API requests.
3. Deepgram, Rev AI, and Assembly AI for converting audio to text.
4. LangChain, Anthropic AI, and OpenAI for report creation.
