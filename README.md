# Fish Audio SDK

JavaScript/TypeScript SDK for [Fish Audio API](https://docs.fish.audio) - providing Text-to-Speech (TTS) and Automatic Speech Recognition (ASR) capabilities.

## Install

```bash
npm install fish-audio-sdk
```

## Usage

### Initialize Session

Create a `Session` instance to access the API. You'll need an API key from Fish Audio.

```typescript
import { Session } from 'fish-audio-sdk';

const session = new Session("your_api_key");
// Optionally specify a different base URL
const customSession = new Session("your_api_key", "https://your-proxy-domain");
```

### Text to Speech (TTS)

The TTS API supports both streaming and async/await patterns. You can customize various parameters like format, bitrate, and prosody.

```typescript
import { Session, TTSRequest } from 'fish-audio-sdk';
import * as fs from 'fs';

const session = new Session("your_api_key");

// Basic TTS request
const request = new TTSRequest({
  text: "Hello, world!",
  format: "mp3",           // 'wav' | 'pcm' | 'mp3' (default: 'mp3')
  mp3Bitrate: 128,         // 64 | 128 | 192 (default: 128)
  chunkLength: 200,        // 100-300 (default: 200)
  normalize: true,         // default: true
  latency: "balanced",     // 'normal' | 'balanced' (default: 'balanced')
  prosody: {
    speed: 1.0,           // default: 1.0
    volume: 0.0           // default: 0.0
  }
});

// Stream to file
const writeStream = fs.createWriteStream("output.mp3");
for await (const chunk of session.tts(request)) {
  writeStream.write(chunk);
}
writeStream.end();
```

### Voice Cloning

You can use reference audio to clone voices:

```typescript
import { TTSRequest, ReferenceAudio } from 'fish-audio-sdk';
import * as fs from 'fs';

// Using a reference model ID
const requestWithModelId = new TTSRequest({
  text: "Hello, world!",
  referenceId: "your_model_id"
});

// Using reference audio directly
const audioBuffer = fs.readFileSync('reference.wav');
const requestWithAudio = new TTSRequest({
  text: "Hello, world!",
  references: [
    new ReferenceAudio({
      audio: audioBuffer,
      text: "Reference text that matches the audio"
    })
  ]
});
```

### Automatic Speech Recognition (ASR)

Convert audio to text with optional language detection:

```typescript
import { Session } from 'fish-audio-sdk';
import * as fs from 'fs';

const session = new Session("your_api_key");
const audioBuffer = fs.readFileSync('audio.mp3');

const result = await session.asr({
  audio: audioBuffer,
  language: "en",              // Optional: specify language
  ignoreTimestamps: false      // Optional: skip timestamp generation
});

console.log(result.text);      // Full transcription
console.log(result.duration);  // Audio duration in seconds
console.log(result.segments);  // Array of {text, start, end} segments
```

### Model Management

List, create, and manage voice models:

```typescript
import { Session } from 'fish-audio-sdk';

const session = new Session("your_api_key");

// List models with pagination and filters
const models = await session.getModels({
  pageSize: 10,
  pageNumber: 1,
  title: "search term",
  tag: ["tag1", "tag2"],
  self: true,               // Only show your models
  authorId: "user_id",
  language: ["en", "zh"],
  titleLanguage: "en",
  sortBy: "created_at"      // 'task_count' | 'created_at'
});

// Get specific model
const model = await session.getModel("model_id");
```

### WebSocket Support

For real-time streaming applications, use the WebSocket interface:

```typescript
import { WebSocketSession, TTSRequest } from 'fish-audio-sdk';

const ws = new WebSocketSession("your_api_key");

async function* textStream() {
  yield "First chunk of text";
  yield "Second chunk of text";
  // ...
}

const request = new TTSRequest({ text: "" }); // Initial empty request

// Stream audio chunks as text is processed
for await (const audioChunk of ws.tts(request, textStream())) {
  // Process audio chunk
}

await ws.close(); // Clean up when done
```

### Error Handling

The SDK provides specific error types:

```typescript
import { HttpCodeError, WebSocketError } from 'fish-audio-sdk';

try {
  await session.getModel("invalid_id");
} catch (error) {
  if (error instanceof HttpCodeError) {
    console.log(`HTTP Error ${error.status}: ${error.message}`);
  } else if (error instanceof WebSocketError) {
    console.log(`WebSocket Error: ${error.message}`);
  }
}
```

### Account Management

Check API credits and package information:

```typescript
const credits = await session.getApiCredit();
console.log(`Available credits: ${credits.credit}`);

const package = await session.getPackage();
console.log(`Package type: ${package.type}`);
console.log(`Balance: ${package.balance}/${package.total}`);
```

## License

[License terms]

## Contributing

[Contributing guidelines]
