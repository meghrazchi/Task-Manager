import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = exception.getStatus();
    const errorResponse = exception.getResponse();

    const payload =
      typeof errorResponse === 'string'
        ? { message: errorResponse }
        : (errorResponse as Record<string, unknown>);

    response.status(status).json({
      success: false,
      statusCode: status,
      ...payload
    });
  }
}
