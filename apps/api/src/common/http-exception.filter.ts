// apps/api/src/common/http-exception.filter.ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

type ErrorBody =
  | string
  | { message?: string | string[]; code?: string }
  | { [k: string]: unknown };

function extractMessage(body: ErrorBody): string {
  if (typeof body === 'string') return body;
  if (Array.isArray((body as { message?: unknown }).message)) {
    const arr = (body as { message: unknown }).message as unknown[];
    return arr.map((x) => String(x)).join(', ');
  }
  const msg = (body as { message?: unknown }).message;
  return typeof msg === 'string' ? msg : 'Unexpected error';
}

function extractCode(body: ErrorBody): string | undefined {
  if (typeof body === 'string') return undefined;
  const code = (body as { code?: unknown }).code;
  return typeof code === 'string' ? code : undefined;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const raw = exception.getResponse() as ErrorBody;
      const message = extractMessage(raw);
      const code = extractCode(raw) ?? this.mapStatusToCode(status);
      return res.status(status).json({ code, message });
    }

    // fallback
    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      exception instanceof Error ? exception.message : 'Unexpected error';
    return res.status(status).json({ code: 'INTERNAL_ERROR', message });
  }

  private mapStatusToCode(status: number) {
    switch (status) {
      case 400:
        return 'BAD_REQUEST';
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 409:
        return 'CONFLICT';
      default:
        return `HTTP_${status}`;
    }
  }
}
