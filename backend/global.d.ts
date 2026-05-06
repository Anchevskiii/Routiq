// Global type declarations for the Routiq backend
// These provide type stubs for modules until npm install is run

// Augment global Express namespace for Multer
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
}

declare module 'helmet' {
  import { RequestHandler } from 'express';
  interface HelmetOptions {
    contentSecurityPolicy?: {
      directives?: Record<string, string | string[]>;
    };
    crossOriginEmbedderPolicy?: boolean;
  }
  function helmet(options?: HelmetOptions): RequestHandler;
  export default helmet;
}

declare module 'express' {
  export interface Request {
    user?: unknown;
  }
  export interface Response {
    cookie(name: string, val: string, opts?: Record<string, unknown>): Response;
    clearCookie(name: string, opts?: Record<string, unknown>): Response;
    status(code: number): Response;
    send(body?: unknown): Response;
    json(body: unknown): Response;
    setHeader(name: string, value: string | string[]): Response;
    end(): void;
  }
  export namespace Multer {
    export interface File {
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
}

declare module '@prisma/client' {
  export enum TravelType {
    CULTURAL = 'CULTURAL',
    GASTRONOMIC = 'GASTRONOMIC',
    ADVENTURE = 'ADVENTURE',
    RELAX = 'RELAX',
    NIGHTLIFE = 'NIGHTLIFE',
    MIXED = 'MIXED',
  }

  export enum GroupRole {
    ADMIN = 'ADMIN',
    MEMBER = 'MEMBER',
  }

  export class PrismaClient {
    user: any;
    itinerary: any;
    group: any;
    groupMember: any;
    groupItinerary: any;
    comment: any;
    vote: any;
    refreshToken: any;
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    $transaction<T>(fn: (prisma: PrismaClient) => Promise<T>): Promise<T>;
  }
}

// Utility types
type ClassDecorator = <T extends new (...args: any[]) => any>(target: T) => T;
type MethodDecorator = (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
type ParameterDecorator = (target: any, propertyKey: string, parameterIndex: number) => void;
