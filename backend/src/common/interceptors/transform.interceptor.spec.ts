import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { TransformInterceptor } from './transform.interceptor';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<unknown>;
  let mockExecutionContext: Partial<ExecutionContext>;
  let mockCallHandler: Partial<CallHandler>;

  beforeEach(() => {
    jest.clearAllMocks();
    interceptor = new TransformInterceptor();

    mockExecutionContext = {};
  });

  it('should transform plain object response to wrap in success: true and data: payload', (done) => {
    const payload = { id: 1, name: 'Item' };
    mockCallHandler = {
      handle: jest.fn().mockReturnValue(of(payload)),
    };

    interceptor
      .intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      )
      .subscribe({
        next: (result) => {
          expect(result).toEqual({
            success: true,
            data: payload,
          });
        },
        error: (err) => done(err),
        complete: () => done(),
      });
  });

  it('should transform paginated response with metadata properly', (done) => {
    const payload = {
      data: [{ id: 1 }, { id: 2 }],
      meta: { page: 1, limit: 10, total: 2 },
    };
    mockCallHandler = {
      handle: jest.fn().mockReturnValue(of(payload)),
    };

    interceptor
      .intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      )
      .subscribe({
        next: (result) => {
          expect(result).toEqual({
            success: true,
            data: payload.data,
            meta: payload.meta,
          });
        },
        error: (err) => done(err),
        complete: () => done(),
      });
  });
});
