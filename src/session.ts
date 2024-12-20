import axios, { AxiosInstance, AxiosError } from 'axios';
import { TTSRequestType, ASRRequestType, ASRResponse, APICreditEntity, PackageEntity, PaginatedResponse, ModelEntity } from './schemas';
import { WebSocketSession } from './websocket';
import msgpack from 'msgpack-lite';
import { Readable } from 'stream';
import { HttpCodeError } from './exceptions';

export class Session {
  private client: AxiosInstance;
  private ws: WebSocketSession;

  constructor(apiKey: string, baseUrl: string = 'https://api.fish.audio') {
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });

    this.client.interceptors.response.use(
      response => response,
      error => {
        if (error instanceof AxiosError && error.response) {
          throw new HttpCodeError(error.response.status, error.response.statusText);
        }
        throw error;
      }
    );

    this.ws = new WebSocketSession(apiKey, baseUrl);
  }

  async *tts(request: TTSRequestType): AsyncGenerator<Buffer> {
    const response = await this.client.post('/v1/tts', msgpack.encode(request), {
      headers: {
        'Content-Type': 'application/msgpack'
      },
      responseType: 'stream',
      transformResponse: (data) => data
    });

    const stream = response.data as Readable;
    for await (const chunk of stream) {
      yield Buffer.from(chunk);
    }
  }

  async getModel(modelId: string): Promise<ModelEntity> {
    const response = await this.client.get(`/model/${modelId}`);
    const data = response.data;
    return {
      ...data,
      id: data._id
    };
  }

  async getModels(params: {
    pageSize?: number;
    pageNumber?: number;
    title?: string;
    tag?: string | string[];
    self?: boolean;
    authorId?: string;
    language?: string | string[];
    titleLanguage?: string | string[];
    sortBy?: 'task_count' | 'created_at';
  } = {}): Promise<PaginatedResponse<ModelEntity>> {
    // Convert snake_case params to camelCase for API
    const apiParams = {
      page_size: params.pageSize,
      page_number: params.pageNumber,
      title: params.title,
      tag: params.tag,
      self: params.self,
      author_id: params.authorId,
      language: params.language,
      title_language: params.titleLanguage,
      sort_by: params.sortBy
    };

    // Filter out undefined values
    const filteredParams = Object.fromEntries(
      Object.entries(apiParams).filter(([_, v]) => v !== undefined)
    );

    const response = await this.client.get('/model', { params: filteredParams });
    return response.data;
  }

  async asr(request: ASRRequestType): Promise<ASRResponse> {
    const response = await this.client.post('/v1/asr', msgpack.encode(request), {
      headers: {
        'Content-Type': 'application/msgpack'
      },
      responseType: 'json'
    });
    return response.data;
  }

  async getApiCredit(): Promise<APICreditEntity> {
    const response = await this.client.get('/wallet/self/api-credit');
    return response.data;
  }

  async getPackage(): Promise<PackageEntity> {
    const response = await this.client.get('/wallet/self/package');
    return response.data;
  }
} 