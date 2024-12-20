import { z } from 'zod';

export const TTSRequest = z.object({
  text: z.string(),
  chunkLength: z.number().min(100).max(300).default(200),
  format: z.enum(['wav', 'pcm', 'mp3']).default('mp3'),
  mp3Bitrate: z.number().refine(val => [64, 128, 192].includes(val), {
    message: 'mp3Bitrate must be one of: 64, 128, 192'
  }).default(128),
  references: z.array(z.object({
    audio: z.instanceof(Buffer),
    text: z.string()
  })).default([]),
  referenceId: z.string().optional(),
  normalize: z.boolean().default(true),
  latency: z.enum(['normal', 'balanced']).default('balanced'),
  prosody: z.object({
    speed: z.number().default(1.0),
    volume: z.number().default(0.0)
  }).optional()
});

export type TTSRequestType = z.infer<typeof TTSRequest>;

export interface ASRRequestType {
  audio: Buffer;
  language?: string;
  ignoreTimestamps?: boolean;
}

export interface ASRSegment {
  text: string;
  start: number;
  end: number;
}

export interface ASRResponse {
  text: string;
  duration: number;
  segments: ASRSegment[];
}

export interface APICreditEntity {
  _id: string;
  user_id: string;
  credit: number;
  created_at: string;
  updated_at: string;
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

export const ASRRequest = z.object({
  audio: z.instanceof(Buffer),
  language: z.string().optional(),
  ignoreTimestamps: z.boolean().optional()
});

export interface PaginatedResponse<T> {
  total: number;
  items: T[];
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
}

// Similar schema definitions for other types... 