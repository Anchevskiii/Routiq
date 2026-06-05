import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';
import { ApiError } from '../types/api-response.type';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_SERVER_ERROR';
    let details: Record<string, unknown> | undefined = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const exceptionObj = exceptionResponse as Record<string, unknown>;
        const msg = exceptionObj.message;
        if (typeof msg === 'string') {
          message = msg;
        } else if (Array.isArray(msg)) {
          message = msg.join(', ');
          details = { validationErrors: msg };
        } else {
          message = exception.message;
        }
      }

      code = exception.constructor.name.replace('Exception', '').toUpperCase();
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      this.logger.warn(
        `Prisma error caught: ${exception.code} - ${exception.message} - Meta: ${JSON.stringify(exception.meta)}`,
      );

      switch (exception.code) {
        case 'P2002': // Unique constraint violation
          status = HttpStatus.CONFLICT;
          code = 'CONFLICT';
          message = 'A record with this value already exists.';
          if (Array.isArray(exception.meta?.target)) {
            details = { target: exception.meta.target };
          }
          break;
        case 'P2025': // Record not found
        case 'P2023': // Inconsistent column data (often invalid UUID format)
        case 'P2015': // Related record not found
          status = HttpStatus.NOT_FOUND;
          code = 'NOT_FOUND';
          message = 'The requested record was not found.';
          break;
        default:
          status = HttpStatus.BAD_REQUEST;
          code = 'BAD_REQUEST';
          message = 'Database operation failed.';
          break;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(
        `Unexpected error: ${exception.message}`,
        exception.stack,
      );
    } else {
      this.logger.error('Unknown exception type', exception);
    }

    const errorResponse: ApiError = {
      success: false,
      error: {
        code,
        message,
        statusCode: status,
        ...(details && { details }),
      },
    };

    response.status(status).json(errorResponse);
  }
}
