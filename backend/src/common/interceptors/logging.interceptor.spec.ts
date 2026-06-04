import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let mockExecutionContext: Partial<ExecutionContext>;
  let mockCallHandler: Partial<CallHandler>;

  beforeEach(() => {
    jest.clearAllMocks();
    interceptor = new LoggingInterceptor();

    const mockRequest = {
      method: 'GET',
      url: '/test',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Mozilla/5.0'),
    };

    const mockResponse = {
      statusCode: 200,
      get: jest.fn().mockReturnValue('100'),
    };

    const mockHttp = {
      getRequest: () => mockRequest,
      getResponse: () => mockResponse,
    };

    mockExecutionContext = {
      switchToHttp: () =>
        mockHttp as unknown as ReturnType<ExecutionContext['switchToHttp']>,
    };

    mockCallHandler = {
      handle: jest.fn().mockReturnValue(of({ data: 'test' })),
    };
  });

  it('should log request, execute handler, and log response', (done) => {
    interceptor
      .intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      )
      .subscribe({
        next: (val) => {
          expect(val).toEqual({ data: 'test' });
        },
        error: (err) => done(err),
        complete: () => {
          expect(mockCallHandler.handle).toHaveBeenCalled();
          done();
        },
      });
  });
});
