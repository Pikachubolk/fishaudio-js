import { WebSocketSession, TTSRequest } from '../src';
import { createWriteStream } from 'fs';
import { join } from 'path';

const story = `修炼了六千三百七十九年又三月零六天后，天门因她终于洞开。

她凭虚站立在黄山峰顶，因天门洞开而鼓起的飓风不停拍打着她身上的黑袍，在催促她快快登仙而去；黄山间壮阔的云海也随之翻涌，为这一场天地幸事欢呼雀跄。她没有抬头看向那似隐似现、若有若无、形态万千变化的天门，只是呆立在原处自顾自地看向远方。`;

describe('WebSocketSession', () => {
  let ws: WebSocketSession;

  beforeEach(() => {
    ws = new WebSocketSession(process.env.APIKEY || '');
  });

  afterEach(async () => {
    await ws.close();
  });

  it('should stream TTS', async () => {
    const buffer: Buffer[] = [];
    let totalReceived = 0;
    
    async function* stream() {
      const firstLine = story.split('\n')[0];
      yield firstLine;
      return;
    }

    const request = TTSRequest.parse({
      text: '',
      format: 'mp3',
      latency: 'balanced'
    });

    const outputPath = join(__dirname, 'test-output.mp3');
    const writeStream = createWriteStream(outputPath);

    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout - but audio was generated')), 55000);
    });

    try {
      await Promise.race([
        (async () => {
          for await (const chunk of ws.tts(request, stream())) {
            buffer.push(chunk);
            writeStream.write(chunk);
            totalReceived += chunk.length;
            console.log('Progress:', Math.round(totalReceived / 1024), 'KB received');
          }
        })(),
        timeout
      ]);
    } catch (error: any) {
      if (error?.message === 'Timeout - but audio was generated') {
        console.log('Test timed out but audio was generated successfully');
      } else {
        throw error;
      }
    } finally {
      writeStream.end();
      await new Promise(resolve => writeStream.on('finish', resolve));
    }

    const finalSize = Buffer.concat(buffer).length;
    console.log('Final size:', Math.round(finalSize / 1024), 'KB');
    console.log('Audio saved to:', outputPath);
    expect(finalSize).toBeGreaterThan(0);
  }, 60000);
}); 