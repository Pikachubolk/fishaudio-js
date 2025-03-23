import { z } from 'zod';

export interface ASRSegment {
  text: string;
  start: number;
  end: number;
}

export interface TTSRequestOptions {
  chunkLength?: number;
  format?: 'wav' | 'pcm' | 'mp3' | 'opus';
  mp3Bitrate?: 64 | 128 | 192;
  opusBitrate?: -1000 | 24 | 32 | 48 | 64;
  sampleRate?: number;
  references?: ReferenceAudio[];
  referenceId?: string;
  modelId?: string;
  normalize?: boolean;
  latency?: 'normal' | 'balanced';
  prosody?: {
    speed: number;
    volume: number;
  };
}

export class ReferenceAudio {
  constructor(public audio: Buffer, public text: string) {}

  toJSON() {
    return {
      audio: this.audio,
      text: this.text
    };
  }
}

export class TTSRequest {
  public chunkLength: number;
  public format: 'wav' | 'pcm' | 'mp3' | 'opus';
  public mp3Bitrate: 64 | 128 | 192;
  public opusBitrate?: -1000 | 24 | 32 | 48 | 64;
  public sampleRate?: number;
  public references: ReferenceAudio[];
  public referenceId?: string;
  public modelId?: string;
  public normalize: boolean;
  public latency: 'normal' | 'balanced';
  public prosody?: { speed: number; volume: number };

  constructor(public text: string, options: Partial<TTSRequestOptions> = {}) {
    this.chunkLength = options.chunkLength ?? 200;
    this.format = options.format ?? 'mp3';
    this.mp3Bitrate = options.mp3Bitrate ?? 128;
    this.opusBitrate = options.opusBitrate;
    this.sampleRate = options.sampleRate;
    this.references = options.references ?? [];
    this.referenceId = options.referenceId;
    this.modelId = options.modelId;
    this.normalize = options.normalize ?? true;
    this.latency = options.latency ?? 'balanced';
    this.prosody = options.prosody;
  }

  toJSON() {
    return {
      text: this.text,
      chunk_length: this.chunkLength,
      format: this.format,
      mp3_bitrate: this.mp3Bitrate,
      opus_bitrate: this.opusBitrate,
      sample_rate: this.sampleRate,
      references: this.references,
      reference_id: this.referenceId,
      model_id: this.modelId,
      normalize: this.normalize,
      latency: this.latency,
      prosody: this.prosody
    };
  }
}

export class ASRRequest {
  constructor(
    public audio: Buffer,
    public language?: string,
    public ignoreTimestamps?: boolean
  ) {}

  toJSON() {
    return {
      audio: this.audio,
      language: this.language,
      ignore_timestamps: this.ignoreTimestamps
    };
  }
}

export class ASRResponse {
  constructor(
    public text: string,
    public duration: number,
    public segments: ASRSegment[]
  ) {}

  static fromJSON(data: any): ASRResponse {
    return new ASRResponse(
      data.text,
      data.duration,
      data.segments.map((s: any) => ({
        text: s.text,
        start: s.start,
        end: s.end
      }))
    );
  }
}

export class PaginatedResponse<T> {
  constructor(
    public total: number,
    public items: T[]
  ) {}

  static fromJSON<T>(data: any): PaginatedResponse<T> {
    return new PaginatedResponse(
      data.total,
      data.items
    );
  }
}

export interface APICreditEntity {
  _id: string;
  user_id: string;
  credit: number;
  created_at: string;
  updated_at: string;
  has_phone_sha256?: boolean;
  has_free_credit?: boolean;
}

export interface PackageEntity {
  _id: string;
  user_id: string;
  type: string;
  total: number;
  balance: number;
  created_at: string;
  updated_at: string;
  finished_at: string;
}

export interface ModelEntity {
  id: string;
  type: 'svc' | 'tts';
  title: string;
  description: string;
  cover_image: string;
  train_mode: 'fast' | 'full';
  state: 'created' | 'training' | 'trained' | 'failed';
  tags: string[];
  samples: SampleEntity[];
  created_at: string;
  updated_at: string;
  languages: string[];
  visibility: 'public' | 'unlist' | 'private';
  lock_visibility: boolean;
  like_count: number;
  mark_count: number;
  shared_count: number;
  task_count: number;
  unliked?: boolean;
  liked: boolean;
  marked: boolean;
  author: AuthorEntity;
}

export interface SampleEntity {
  title: string;
  text: string;
  task_id: string;
  audio: string;
}

export interface AuthorEntity {
  id: string;
  username: string;
  avatar: string;
  nickname?: string;
}

export interface ModelListParams {
  pageSize?: number;
  pageNumber?: number;
  title?: string;
  tag?: string | string[];
  self?: boolean;
  authorId?: string;
  language?: string | string[];
  titleLanguage?: string;
  type?: 'svc' | 'tts';
  sortBy?: 'score' | 'task_count' | 'created_at';
}

export interface ModelCreateParams {
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
}

export interface ModelUpdateParams {
  title?: string;
  description?: string;
  coverImage?: Buffer;
  visibility?: 'public' | 'unlist' | 'private';
  tags?: string[];
}

export interface ApiCreditParams {
  checkFreeCredit?: boolean;
}

// Similar schema definitions for other types... 