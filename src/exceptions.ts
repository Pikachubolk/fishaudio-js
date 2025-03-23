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

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class AuthenticationError extends HttpCodeError {
  constructor(message: string = 'Authentication failed') {
    super(401, message);
    this.name = 'AuthenticationError';
  }
}

export class PaymentRequiredError extends HttpCodeError {
  constructor(message: string = 'Payment required') {
    super(402, message);
    this.name = 'PaymentRequiredError';
  }
}

export class NotFoundError extends HttpCodeError {
  constructor(message: string = 'Resource not found') {
    super(404, message);
    this.name = 'NotFoundError';
  }
} 