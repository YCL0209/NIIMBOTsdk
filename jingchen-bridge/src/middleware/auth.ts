import { Request, Response, NextFunction } from 'express';
import { API_KEY, ALLOWED_IPS } from '../config';

function ipToInt(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
}

function isIpInCidr(ip: string, cidr: string): boolean {
  if (cidr.includes('/')) {
    const [network, bits] = cidr.split('/');
    const mask = (~0 << (32 - parseInt(bits))) >>> 0;
    return (ipToInt(ip) & mask) === (ipToInt(network) & mask);
  }
  return ip === cidr;
}

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress?.replace(/^::ffff:/, '') || '';
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Skip auth for health check
  if (req.path === '/health') {
    next();
    return;
  }

  // API Key check
  if (API_KEY) {
    const key = req.headers['x-api-key'];
    if (key !== API_KEY) {
      res.status(401).json({ error: 'Invalid or missing API key' });
      return;
    }
  }

  // IP whitelist check
  if (ALLOWED_IPS.length > 0) {
    const clientIp = getClientIp(req);
    const allowed = ALLOWED_IPS.some(entry => isIpInCidr(clientIp, entry));
    if (!allowed) {
      res.status(403).json({ error: `IP ${clientIp} not allowed` });
      return;
    }
  }

  next();
}
