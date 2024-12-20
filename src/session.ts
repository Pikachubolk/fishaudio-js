import axios, { AxiosError } from 'axios';
import { TTSRequest, ASRRequest, ModelEntity, PaginatedResponse, APICreditEntity, PackageEntity, ASRResponse } from './schemas';
import { HttpCodeError } from './exceptions';
import msgpack from 'msgpack-lite';

export class Session {
  private client: ReturnType<typeof axios.create>;

  constructor(apiKey: string, baseUrl: string = 'https://api.fish.audio') {
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        Authorization: `Bearer ${apiKey}`
      },
      timeout: 0
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        if (error instanceof AxiosError && error.response) {
          throw new HttpCodeError(
            error.response.status,
            error.response.data?.detail || error.response.statusText
          );
        }
        throw error;
      }
    );
  }

  async *tts(request: TTSRequest): AsyncGenerator<Buffer> {
    const response = await this.client.post('/v1/tts', 
      msgpack.encode(request.toJSON()),
      { 
        responseType: 'stream',
        headers: {
          'Content-Type': 'application/msgpack'
        }
      }
    );

    for await (const chunk of response.data) {
      yield Buffer.from(chunk);
    }
  }

  async asr(request: ASRRequest): Promise<ASRResponse> {
    const response = await this.client.post('/v1/asr',
      msgpack.encode(request.toJSON()),
      {
        headers: {
          'Content-Type': 'application/msgpack'
        }
      }
    );
    return ASRResponse.fromJSON(response.data);
  }

  async listModels(params: {
    pageSize?: number;
    pageNumber?: number;
    title?: string;
    tag?: string | string[];
    self?: boolean;
    authorId?: string;
    language?: string | string[];
    titleLanguage?: string;
    sortBy?: 'task_count' | 'created_at';
  } = {}): Promise<PaginatedResponse<ModelEntity>> {
    const response = await this.client.get('/model', { params });
    return PaginatedResponse.fromJSON(response.data);
  }

  async getModel(modelId: string): Promise<ModelEntity> {
    const response = await this.client.get(`/model/${modelId}`);
    return {
      ...response.data,
      id: response.data._id
    };
  }

  async createModel(params: {
    visibility?: 'public' | 'unlist' | 'private';
    type?: 'tts';
    title: string;
    description?: string;
    coverImage?: Buffer;
    trainMode?: 'fast';
    voices: Buffer[];
    texts?: string[];
    tags?: string[];
    enhanceAudioQuality?: boolean;
  }): Promise<ModelEntity> {
    const formData = new FormData();
    
    // Add file data
    params.voices.forEach((voice, i) => {
      formData.append('voices', new Blob([voice]));
    });
    
    if (params.coverImage) {
      formData.append('cover_image', new Blob([params.coverImage]));
    }

    // Add other fields
    formData.append('visibility', params.visibility || 'private');
    formData.append('type', params.type || 'tts');
    formData.append('title', params.title);
    if (params.description) formData.append('description', params.description);
    formData.append('train_mode', params.trainMode || 'fast');
    if (params.texts) params.texts.forEach(text => formData.append('texts', text));
    if (params.tags) params.tags.forEach(tag => formData.append('tags', tag));
    formData.append('enhance_audio_quality', String(params.enhanceAudioQuality ?? true));

    const response = await this.client.post('/model', formData);
    return response.data;
  }

  async deleteModel(modelId: string): Promise<void> {
    await this.client.delete(`/model/${modelId}`);
  }

  async updateModel(modelId: string, params: {
    title?: string;
    description?: string;
    coverImage?: Buffer;
    visibility?: 'public' | 'unlist' | 'private';
    tags?: string[];
  }): Promise<void> {
    const formData = new FormData();
    
    if (params.coverImage) {
      formData.append('cover_image', new Blob([params.coverImage]));
    }

    if (params.title) formData.append('title', params.title);
    if (params.description) formData.append('description', params.description);
    if (params.visibility) formData.append('visibility', params.visibility);
    if (params.tags) params.tags.forEach(tag => formData.append('tags', tag));

    await this.client.patch(`/model/${modelId}`, formData);
  }

  async getApiCredit(): Promise<APICreditEntity> {
    const response = await this.client.get('/wallet/self/api-credit');
    return response.data;
  }

  async getPackage(): Promise<PackageEntity> {
    const response = await this.client.get('/wallet/self/package');
    return response.data;
  }

  // ... other methods matching Python implementation
} 