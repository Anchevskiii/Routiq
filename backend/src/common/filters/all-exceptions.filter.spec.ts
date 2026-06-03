import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';
import { AllExceptionsFilter } from './all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockResponse: Partial<Response>;
  let mockArgumentsHost: Partial<ArgumentsHost>;

  beforeEach(() => {
    jest.clearAllMocks();
    filter = new AllExceptionsFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    const mockHttpArgumentsHost = {
      getResponse: jest.fn().mockReturnValue(mockResponse),
      getRequest: jest.fn(),
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue(mockHttpArgumentsHost),
    };
  });

  it('should handle HttpException with string message', () => {
    const error = new HttpException('Test HTTP Exception', HttpStatus.BAD_REQUEST);
    filter.catch(error, mockArgumentsHost as ArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'HTTP',
        message: 'Test HTTP Exception',
        statusCode: HttpStatus.BAD_REQUEST,
      },
    });
  });

  it('should handle HttpException with object message and array of validation errors', () => {
    const validationErrors = ['email must be an email', 'password must be longer'];
    const error = new HttpException(
      { message: validationErrors },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    filter.catch(error, mockArgumentsHost as ArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'HTTP',
        message: validationErrors.join(', '),
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        details: { validationErrors },
      },
    });
  });

  it('should handle Prisma known request error P2002 (Unique constraint violation)', () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError('Unique error', {
      code: 'P2002',
      clientVersion: '1.0.0',
      meta: { target: ['email'] },
    });

    filter.catch(prismaError, mockArgumentsHost as ArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'CONFLICT',
        message: 'A record with this value already exists.',
        statusCode: HttpStatus.CONFLICT,
        details: { target: ['email'] },
      },
    });
  });

  it('should handle Prisma known request error P2025 (Record not found)', () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError('Not found error', {
      code: 'P2025',
      clientVersion: '1.0.0',
    });

    filter.catch(prismaError, mockArgumentsHost as ArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'The requested record was not found.',
        statusCode: HttpStatus.NOT_FOUND,
      },
    });
  });

  it('should fallback to default Prisma known request error handler', () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError('Some other prisma error', {
      code: 'P5000',
      clientVersion: '1.0.0',
    });

    filter.catch(prismaError, mockArgumentsHost as ArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Database operation failed.',
        statusCode: HttpStatus.BAD_REQUEST,
      },
    });
  });

  it('should handle general Error', () => {
    const error = new Error('General runtime error');
    filter.catch(error, mockArgumentsHost as ArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'General runtime error',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      },
    });
  });

  it('should handle unknown exception types', () => {
    filter.catch('Some unknown error string', mockArgumentsHost as ArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      },
    });
  });
});
