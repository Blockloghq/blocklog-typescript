export class BlocklogError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BlocklogError';
  }
}

export class BlocklogAuthError extends BlocklogError {
  constructor(message: string) {
    super(message);
    this.name = 'BlocklogAuthError';
  }
}

export class BlocklogTransportError extends BlocklogError {
  public status?: number;
  public responseText?: string;

  constructor(message: string, status?: number, responseText?: string) {
    super(message);
    this.name = 'BlocklogTransportError';
    this.status = status;
    this.responseText = responseText;
  }
}

export class BlocklogVerificationError extends BlocklogError {
  constructor(message: string) {
    super(message);
    this.name = 'BlocklogVerificationError';
  }
}

export class BlocklogCommitError extends BlocklogError {
  constructor(message: string) {
    super(message);
    this.name = 'BlocklogCommitError';
  }
}

// Shared error model for API clients
export class ApiError extends BlocklogError {
  public status?: number;
  public code?: string;
  public details?: any;

  constructor(message: string, status?: number, code?: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class AuthenticationError extends BlocklogAuthError {
  constructor(message: string = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends BlocklogError {
  public retryAfter?: number;

  constructor(message: string = 'Rate limit exceeded', retryAfter?: number) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class ValidationError extends BlocklogError {
  public field?: string;
  public value?: any;

  constructor(message: string, field?: string, value?: any) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
  }
}

export class TransportError extends BlocklogTransportError {
  constructor(message: string, status?: number, responseText?: string) {
    super(message, status, responseText);
    this.name = 'TransportError';
  }
}
