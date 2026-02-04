import { Request, Response, NextFunction } from 'express';
import { getToken } from 'next-auth/jwt';
import { IncomingMessage } from 'http';

// Extend Express Request to include user information
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    name?: string;
  };
}

// Middleware that requires authentication
export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = await getToken({ 
      req: req as IncomingMessage & { cookies: Partial<{ [key: string]: string; }>; },
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (!token || !token.sub) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Add user info to request
    req.user = {
      id: token.sub,
      email: token.email || undefined,
      name: token.name || undefined,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Invalid authentication' });
  }
};

// Middleware that optionally adds user info if authenticated
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = await getToken({ 
      req: req as IncomingMessage & { cookies: Partial<{ [key: string]: string; }>; },
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (token && token.sub) {
      // Add user info to request if authenticated
      req.user = {
        id: token.sub,
        email: token.email || undefined,
        name: token.name || undefined,
      };
    }

    next();
  } catch (error) {
    // Log error but continue - auth is optional
    console.error('Optional auth middleware error:', error);
    next();
  }
};