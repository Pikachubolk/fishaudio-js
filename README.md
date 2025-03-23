# Fish Audio SDK

JavaScript/TypeScript SDK for [Fish Audio API](https://docs.fish.audio).

## Install

```bash
npm install fish-audio-sdk
```

## Usage

Initialize a `Session` to use APIs. All APIs use async/await patterns.

```typescript
import { Session } from 'fish-audio-sdk';

const session = new Session("your_api_key");
```

You can change the endpoint if needed:

```typescript
const session = new Session("your_api_key", "https://your-proxy-domain");
```

## Text to Speech (TTS)

```typescript
import { Session, TTSRequest } from 'fish-audio-sdk';
import * as fs from 'fs';

const session = new Session("your_api_key");

// Basic usage
const writeStream = fs.createWriteStream("output.mp3");
for await (const chunk of session.tts(new TTSRequest("Hello, world!"))) {
  writeStream.write(chunk);
}
writeStream.end();

// With advanced options
const request = new TTSRequest("Hello, world!", {
  format: "mp3",           // 'wav' | 'pcm' | 'mp3' | 'opus'
  mp3Bitrate: 128,         // 64 | 128 | 192
  chunkLength: 200,        // 100-300
  normalize: true,         // Audio normalization
  latency: "balanced",     // 'normal' | 'balanced'
  referenceId: "model_id", // Use a specific trained model
  prosody: {
    speed: 1.0,            // Speech speed
    volume: 0.0            // Volume adjustment
  }
});
```

## Real-time TTS with WebSocket

For streaming text-to-speech in real-time:

```typescript
import { WebSocketSession, TTSRequest } from 'fish-audio-sdk';

const ws = new WebSocketSession("your_api_key");

async function* textStream() {
  yield "First chunk of text";
  yield "Second chunk of text";
  // ...
}

const request = new TTSRequest("", {
  format: "mp3",
  latency: "balanced"
});

// Stream audio chunks as text is processed
for await (const audioChunk of ws.tts(request, textStream())) {
  // Process audio chunk
}

await ws.close(); // Clean up when done
```

## Automatic Speech Recognition (ASR)

Convert audio to text with optional language detection:

```typescript
import { Session, ASRRequest } from 'fish-audio-sdk';
import * as fs from 'fs';

const session = new Session("your_api_key");
const audioBuffer = fs.readFileSync('audio.mp3');

const result = await session.asr(new ASRRequest(
  audioBuffer,
  "en",              // Optional: specify language
  false              // Optional: include timestamps
));

console.log(result.text);      // Full transcription
console.log(result.duration);  // Audio duration in seconds
console.log(result.segments);  // Array of {text, start, end} segments
```

## Voice Cloning and Model Management

### Create Voice Models

```typescript
import { Session } from 'fish-audio-sdk';
import * as fs from 'fs';

const session = new Session("your_api_key");

// Create a new voice model
const voiceData = fs.readFileSync('voice_sample.wav');
const model = await session.createModel({
  title: "My Voice Model",
  description: "Custom voice model",
  voices: [voiceData],
  texts: ["Text matching the voice sample"],
  tags: ["custom", "voice"],
  enhanceAudioQuality: true,
  visibility: "private", // 'public' | 'unlist' | 'private'
  type: "tts",
  trainMode: "fast"
});

console.log(`Model created with ID: ${model.id}`);
```

### List and Filter Models

```typescript
// List models with pagination and filters
const models = await session.listModels({
  pageSize: 10,
  pageNumber: 1,
  title: "search term",
  tag: ["tag1", "tag2"],
  self: true,               // Only show your models
  authorId: "user_id",
  language: ["en", "zh"],
  titleLanguage: "en",
  sortBy: "created_at"      // 'score' | 'task_count' | 'created_at'
});

console.log(`Found ${models.total} models`);
models.items.forEach(model => {
  console.log(`- ${model.title} (ID: ${model.id})`);
});
```

### Manage Models

```typescript
// Get specific model details
const model = await session.getModel("model_id");
console.log(model);

// Update model properties
await session.updateModel("model_id", {
  title: "Updated Title",
  description: "New description",
  visibility: "public",
  tags: ["updated", "tags"]
});

// Delete model
await session.deleteModel("model_id");
```

## Account and Wallet Management

Check API credits and package information:

```typescript
// Get API credit information
const credits = await session.getApiCredit();
console.log(`Available credits: ${credits.credit}`);
console.log(`Has free credit: ${credits.has_free_credit}`);
console.log(`Has phone verified: ${credits.has_phone_sha256}`);

// Get premium package information
const package = await session.getPackage();
console.log(`Package type: ${package.type}`);
console.log(`Balance: ${package.balance}/${package.total}`);
console.log(`Expires: ${package.finished_at}`);
```

## Error Handling

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

## Supported Audio Formats

### Input (for ASR)
- WAV/PCM (16-bit, mono)
- MP3 (mono)

### Output (for TTS)
- WAV/PCM (Sample rates: 8kHz, 16kHz, 24kHz, 32kHz, 44.1kHz - default: 44.1kHz)
- MP3 (Sample rates: 32kHz, 44.1kHz - default: 44.1kHz, Bitrates: 64kbps, 128kbps, 192kbps)
- Opus (Sample rate: 48kHz, Bitrates: -1000 (auto), 24kbps, 32kbps, 48kbps, 64kbps)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
