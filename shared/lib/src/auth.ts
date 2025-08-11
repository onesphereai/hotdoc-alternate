import { UnauthorizedError } from './errors';

export interface JWTPayload {
  sub: string;
  email?: string;
  'custom:tenantId'?: string;
  'custom:role'?: string;
  [key: string]: any;
}

export function extractTenantId(event: any): string {
  const tenantId = event.headers?.['x-tenant-id'] || 
                   event.requestContext?.authorizer?.claims?.['custom:tenantId'];
  
  if (!tenantId) {
    throw new UnauthorizedError('Tenant ID not found');
  }
  
  return tenantId;
}

export function extractUserId(event: any): string {
  const userId = event.requestContext?.authorizer?.claims?.sub;
  
  if (!userId) {
    throw new UnauthorizedError('User ID not found');
  }
  
  return userId;
}

export function extractClaims(event: any): JWTPayload {
  const claims = event.requestContext?.authorizer?.claims;
  
  if (!claims) {
    throw new UnauthorizedError('JWT claims not found');
  }
  
  return claims;
}