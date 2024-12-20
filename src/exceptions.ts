export class HttpCodeError extends Error {
  constructor(public status: number, message: string) {
    super(`${status} ${message}`);
    this.name = 'HttpCodeError';
  }
}

export class WebSocketError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WebSocketError';
  }
} 