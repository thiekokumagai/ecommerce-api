import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(Error)
export class DomainExceptionsFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = exception.message || 'Erro interno do servidor';

    // Mapeamento de erros de domínio para HTTP
    if (exception.name.endsWith('NotFoundError')) {
      status = HttpStatus.NOT_FOUND;
    } else if (exception.name.endsWith('ValidationError') || exception.name.endsWith('InvalidOperationError')) {
      status = HttpStatus.BAD_REQUEST;
    } else if (exception.name.endsWith('UnauthorizedError')) {
      status = HttpStatus.UNAUTHORIZED;
    } else if (exception.name.endsWith('ConflictError')) {
      status = HttpStatus.CONFLICT;
    }

    response.status(status).json({
      statusCode: status,
      message: message,
      error: exception.name,
      timestamp: new Date().toISOString(),
    });
  }
}
