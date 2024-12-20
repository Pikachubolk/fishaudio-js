import WebSocket from 'ws';
import { TTSRequest, ASRRequest, ModelEntity, PaginatedResponse, APICreditEntity, PackageEntity } from './schemas';
import { WebSocketError } from './exceptions';
import msgpack from 'msgpack-lite';

export class WebSocketSession {
  private activeConnections: Set<WebSocket> = new Set();

  constructor(
    private apiKey: string, 
    private baseUrl: string = 'https://api.fish.audio'
  ) {}

  async close() {
    const promises = Array.from(this.activeConnections).map(ws => 
      new Promise<void>(resolve => {
        ws.once('close', () => resolve());
        ws.close();
      })
    );
    await Promise.all(promises);
    this.activeConnections.clear();
  }

  async *tts(request: TTSRequest, textStream: AsyncIterable<string>): AsyncGenerator<Buffer> {
    const ws = new WebSocket(`${this.baseUrl}/v1/tts/live`, {
      headers: { Authorization: `Bearer ${this.apiKey}` }
    });

    this.activeConnections.add(ws);

    await new Promise<void>((resolve, reject) => {
      ws.once('open', resolve);
      ws.once('error', reject);
    });

    // Send start event
    ws.send(msgpack.encode({
      event: 'start',
      request: request.toJSON()
    }));

    // Handle text stream
    for await (const text of textStream) {
      ws.send(msgpack.encode({
        event: 'text',
        text
      }));
    }

    // Send close event
    ws.send(msgpack.encode({
      event: 'stop'
    }));

    // Handle responses
    try {
      for await (const message of createMessageStream(ws)) {
        const data = msgpack.decode(message);
        if (data.event === 'audio') {
          yield Buffer.from(data.audio);
        } else if (data.event === 'finish') {
          if (data.reason === 'error') {
            throw new WebSocketError('Server error');
          }
          break;
        }
      }
    } finally {
      ws.close();
      this.activeConnections.delete(ws);
    }
  }
}

function createMessageStream(ws: WebSocket): AsyncGenerator<Buffer, void, unknown> {
  let messageResolver: ((value: Buffer) => void) | null = null;
  let errorResolver: ((error: Error) => void) | null = null;
  
  const messageHandler = (data: Buffer) => messageResolver?.(data);
  const errorHandler = (error: Error) => errorResolver?.(error);
  const closeHandler = () => errorResolver?.(new WebSocketError('Connection closed'));
  
  ws.on('message', messageHandler);
  ws.on('error', errorHandler);
  ws.on('close', closeHandler);

  const cleanup = () => {
    ws.off('message', messageHandler);
    ws.off('error', errorHandler);
    ws.off('close', closeHandler);
  };

  return {
    async next(): Promise<IteratorResult<Buffer>> {
      try {
        const value = await new Promise<Buffer>((resolve, reject) => {
          messageResolver = resolve;
          errorResolver = reject;
        });
        return { value, done: false };
      } catch (error) {
        cleanup();
        throw error;
      }
    },
    async return() {
      cleanup();
      return { value: undefined, done: true };
    },
    async throw(error) {
      cleanup();
      throw error;
    },
    [Symbol.asyncIterator]() {
      return this;
    },
  };
} 