import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../types/api-response.type';

interface DataWithMeta<T> {
  data: T;
  meta: ApiResponse['meta'];
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T | DataWithMeta<T>,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data: T | DataWithMeta<T>) => {
        if (
          typeof data === 'object' &&
          data !== null &&
          'data' in data &&
          'meta' in data
        ) {
          const paginatedData = data as DataWithMeta<T>;
          return {
            success: true,
            data: paginatedData.data,
            meta: paginatedData.meta,
          };
        }

        return {
          success: true,
          data: data as T,
        };
      }),
    );
  }
}
