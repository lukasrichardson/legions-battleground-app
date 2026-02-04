import { Request, Response, Application } from 'express';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: {
    id?: string;
    name?: string;
    email?: string;
  };
}

export type ExpressApp = Application;
export type ExpressRequest = Request;
export type ExpressResponse = Response;