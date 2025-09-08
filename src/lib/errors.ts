export type ErrorCode =
  | 'EMAIL_ALREADY_EXISTS'
  | 'INVALID_CREDENTIALS'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

export class ApiError extends Error {
  errorCode: string;
  statusCode: number;
  detailedMessage: string;

  constructor(errorCode: ErrorCode, message?: string) {
    super(message);
    this.errorCode = errorCode;
    this.statusCode = getStatusCodeByType(errorCode);
    this.detailedMessage = getMessageByErrorCode(errorCode);

    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static fromResponse = async (res: Response): Promise<ApiError> => {
    try {
      const data = await res.json();
      return new ApiError(data.error_code ?? 'UNKNOWN_ERROR', data.message ?? res.statusText);
    } catch {
      return new ApiError('UNKNOWN_ERROR', res.statusText);
    }
  };

  public toResponse() {
    const { errorCode, message, cause, statusCode } = this;

    return Response.json({ errorCode, message, cause }, { status: statusCode });
  }
}

export function getMessageByErrorCode(errorCode: ErrorCode): string {
  switch (errorCode) {
    case 'VALIDATION_ERROR':
      return "The request couldn't be processed. Please check your input and try again.";
    case 'NOT_FOUND':
      return 'The requested resource was not found. Please check the resource ID and try again.';
    case 'FORBIDDEN':
      return 'This resource belongs to another user. Please check the resource ID and try again.';
    case 'UNAUTHORIZED':
      return 'You need to sign in to view this resource. Please sign in and try again.';
    case 'NETWORK_ERROR':
      return 'Please check your internet connection and try again.';
    default:
      return 'Something went wrong. Please try again later.';
  }
}

function getStatusCodeByType(type: ErrorCode) {
  switch (type) {
    case 'VALIDATION_ERROR':
    case 'EMAIL_ALREADY_EXISTS':
      return 400;
    case 'UNAUTHORIZED':
    case 'INVALID_CREDENTIALS':
      return 401;
    case 'FORBIDDEN':
      return 403;
    case 'NOT_FOUND':
      return 404;
    case 'NETWORK_ERROR':
      return 503;
    default:
      return 500;
  }
}
