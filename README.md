# Fish Audio SDK

JavaScript/TypeScript SDK for https://docs.fish.audio.

## Install

```bash
npm install fish-audio-sdk
```

## Usage

Initialize a `Session` to use APIs. All APIs have synchronous and asynchronous versions. If you want to use the asynchronous version of the API, you can use the Promise-based version of each method.

```typescript
import { Session } from 'fish-audio-sdk';

const session = new Session("your_api_key");
```

Sometimes, you may need to change our endpoint to another address. You can use:

```typescript
import { Session } from 'fish-audio-sdk';

const session = new Session("your_api_key", {
  baseUrl: "https://your-proxy-domain"
});
```

### Text to speech

```typescript
import { Session, TTSRequest } from 'fish-audio-sdk';
import * as fs from 'fs';

const session = new Session("your_api_key");

// Using streams
const writeStream = fs.createWriteStream("output.mp3");
const ttsStream = session.tts(new TTSRequest({ text: "Hello, world!" }));
ttsStream.pipe(writeStream);
```

Or use async/await version:

```typescript
import { Session, TTSRequest } from 'fish-audio-sdk';
import * as fs from 'fs/promises';

const session = new Session("your_api_key");

async function main() {
  const chunks = [];
  for await (const chunk of session.ttsAsync(new TTSRequest({ text: "Hello, world!" }))) {
    chunks.push(chunk);
  }
  await fs.writeFile("output.mp3", Buffer.concat(chunks));
}

main();
```

#### Reference Audio

```typescript
import { TTSRequest } from 'fish-audio-sdk';

new TTSRequest({
  text: "Hello, world!",
  referenceId: "your_model_id"
});
```

Or use `ReferenceAudio` in `TTSRequest`:

```typescript
import { TTSRequest, ReferenceAudio } from 'fish-audio-sdk';

new TTSRequest({
  text: "Hello, world!",
  references: [
    new ReferenceAudio({
      audio: audioBuffer, // Buffer containing audio data
      text: "reference audio text"
    })
  ]
});
```

### List models

```typescript
const models = session.listModels();
console.log(models);
```

Or use async version:

```typescript
async function main() {
  const models = await session.listModelsAsync();
  console.log(models);
}

main();
```

### Get a model info by id

```typescript
const model = session.getModel("your_model_id");
console.log(model);
```

Or use async version:

```typescript
async function main() {
  const model = await session.getModelAsync("your_model_id");
  console.log(model);
}

main();
```

### Create a model

```typescript
const model = session.createModel({
  title: "test",
  description: "test",
  voices: [voiceBuffer1, voiceBuffer2], // Buffers containing audio data
  coverImage: imageBuffer // Buffer containing image data
});
console.log(model);
```

Or use async version:

```typescript
async function main() {
  const model = await session.createModelAsync({
    title: "test",
    description: "test",
    voices: [voiceBuffer1, voiceBuffer2],
    coverImage: imageBuffer
  });
  console.log(model);
}

main();
```

### Delete a model

```typescript
session.deleteModel("your_model_id");
```

Or use async version:

```typescript
async function main() {
  await session.deleteModelAsync("your_model_id");
}

main();
```
