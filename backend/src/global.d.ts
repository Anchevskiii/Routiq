// Global type declarations for the Routiq backend
// These provide type augmentations for the Express and Multer namespaces

declare namespace Express {
  namespace Multer {
    interface File {
      fieldname: string;
      originalname: string;
      encoding: string;
      mimetype: string;
      size: number;
      destination?: string;
      filename?: string;
      path?: string;
      buffer?: Buffer;
    }
  }
  
  interface Request {
    user?: unknown;
  }
}

// Utility types for decorators
type ClassDecorator = <T extends new (...args: unknown[]) => unknown>(target: T) => T;
type MethodDecorator = (target: object, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
type ParameterDecorator = (target: object, propertyKey: string, parameterIndex: number) => void;
