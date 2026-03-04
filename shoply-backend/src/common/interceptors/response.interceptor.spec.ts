import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { ResponseInterceptor } from './response.interceptor';

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor;

  beforeEach(() => {
    interceptor = new ResponseInterceptor();
  });

  const mockCtx = {} as ExecutionContext;

  describe('intercept', () => {
    it('should wrap response data with success, data, and timestamp', (done) => {
      const callHandler: CallHandler = {
        handle: () => of({ id: 1, name: 'test' }),
      };

      interceptor.intercept(mockCtx, callHandler).subscribe((result) => {
        const r = result as { success: boolean; data: unknown; timestamp: string };
        expect(r.success).toBe(true);
        expect(r.data).toEqual({ id: 1, name: 'test' });
        expect(r.timestamp).toBeDefined();
        expect(typeof r.timestamp).toBe('string');
        done();
      });
    });

    it('should wrap null data correctly', (done) => {
      const callHandler: CallHandler = {
        handle: () => of(null),
      };

      interceptor.intercept(mockCtx, callHandler).subscribe((result) => {
        const r = result as { success: boolean; data: unknown };
        expect(r.success).toBe(true);
        expect(r.data).toBeNull();
        done();
      });
    });
  });
});
