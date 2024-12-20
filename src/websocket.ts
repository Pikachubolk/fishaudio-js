import WebSocket from 'ws';
import { TTSRequestType } from './schemas';
import { WebSocketError } from './exceptions';
import msgpack from 'msgpack-lite';

interface StartEvent {
  event: 'start';
  request: TTSRequestType;
}

interface TextEvent {
  event: 'text';
  text: string;
}

interface CloseEvent {
  event: 'stop';
}

interface AudioEvent {
  event: 'audio';
  audio: Buffer;
}

interface FinishEvent {
  event: 'finish';
  reason: 'error' | 'stop';
}

type WSEvent = AudioEvent | FinishEvent;

export class WebSocketSession {
  private activeConnections: Set<WebSocket> = new Set();
  private baseUrl: string;
  private apiKey: string;

  constructor(apiKey: string, baseUrl: string = 'https://api.fish.audio') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace('https://', 'wss://');
  }

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

  private createMessageStream(ws: WebSocket): AsyncGenerator<Buffer> {
    let messageResolver: ((value: Buffer) => void) | null = null;
    let errorResolver: ((error: Error) => void) | null = null;
    
    const messageHandler = (data: Buffer) => messageResolver?.(data);
    const errorHandler = (error: Error) => errorResolver?.(error);
    const closeHandler = () => errorResolver?.(new WebSocketError('Connection closed'));
    
    ws.setMaxListeners(3); // Only need 3 listeners: message, error, close
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

  async *tts(request: TTSRequestType, textStream: AsyncIterable<string>): AsyncGenerator<Buffer> {
    const ws = new WebSocket(`${this.baseUrl}/v1/tts/live`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`
      }
    });
    
    this.activeConnections.add(ws);

    try {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new WebSocketError('Connection timeout'));
        }, 5000);

        ws.once('open', () => {
          clearTimeout(timeout);
          resolve();
        });
        
        ws.once('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });

      const messageStream = this.createMessageStream(ws);

      const sender = async () => {
        ws.send(msgpack.encode({
          event: 'start',
          request
        }));

        for await (const text of textStream) {
          ws.send(msgpack.encode({
            event: 'text',
            text
          }));
        }

        ws.send(msgpack.encode({
          event: 'stop'
        }));
      };

      const senderPromise = sender();

      try {
        for await (const message of messageStream) {
          const data = msgpack.decode(message) as WSEvent;
          
          if (data.event === 'audio') {
            yield Buffer.from(data.audio);
          } else if (data.event === 'finish') {
            if (data.reason === 'error') {
              throw new WebSocketError('Server returned error');
            }
            return;
          }
        }
      } finally {
        await senderPromise.catch(() => {}); // Ignore sender errors during cleanup
      }
    } finally {
      ws.close();
      this.activeConnections.delete(ws);
    }
  }
} 