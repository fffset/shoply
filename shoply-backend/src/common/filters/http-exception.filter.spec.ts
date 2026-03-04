import { HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

function mockArgumentsHost(responseMock: {
  status: jest.Mock;
  json: jest.Mock;
}): ArgumentsHost {
  return {
    switchToHttp: jest.fn().mockReturnValue({
      getResponse: jest.fn().mockReturnValue(responseMock),
    }),
  } as unknown as ArgumentsHost;
}

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockResponse: { status: jest.Mock; json: jest.Mock };

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    const jsonMock = jest.fn();
    mockResponse = {
      status: jest.fn().mockReturnValue({ json: jsonMock }),
      json: jsonMock,
    };
  });

  describe('catch', () => {
    it('should format response with string exception message', () => {
      const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);
      const host = mockArgumentsHost(mockResponse);

      filter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.status(404).json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          statusCode: 404,
          message: 'Not found',
          timestamp: expect.any(String),
        }),
      );
    });

    it('should format response with object exception having string message', () => {
      const exception = new HttpException(
        { message: 'Email already in use' },
        HttpStatus.CONFLICT,
      );
      const host = mockArgumentsHost(mockResponse);

      filter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.status(409).json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Email already in use',
        }),
      );
    });

    it('should format validation errors when message is an array', () => {
      const exception = new HttpException(
        { message: ['email must be valid', 'password too short'] },
        HttpStatus.BAD_REQUEST,
      );
      const host = mockArgumentsHost(mockResponse);

      filter.catch(exception, host);

      expect(mockResponse.status(400).json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          statusCode: 400,
          message: 'Validation failed',
          errors: ['email must be valid', 'password too short'],
        }),
      );
    });

    it('should use fallback message for unknown exception shape', () => {
      const exception = new HttpException({}, HttpStatus.INTERNAL_SERVER_ERROR);
      const host = mockArgumentsHost(mockResponse);

      filter.catch(exception, host);

      expect(mockResponse.status(500).json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'An error occurred',
        }),
      );
    });
  });
});
