import { describe, expect, it } from 'vitest';
import { type OAuthOptions, oauthResourceServer } from '../src/oauth';

const opts: OAuthOptions = {
  resource: 'https://api.example.com/mcp',
  authorizationServers: ['https://auth.example.com'],
  verifyToken: (token) =>
    token === 'good'
      ? { aud: 'https://api.example.com/mcp', scope: 'mcp' }
      : token === 'wrong-aud'
        ? { aud: 'https://other.example.com' }
        : null,
};

const guard = oauthResourceServer(opts);

const req = (headers: Record<string, string> = {}, path = '/mcp') =>
  new Request(`https://api.example.com${path}`, { headers });

describe('oauthResourceServer', () => {
  it('challenges an unauthenticated request with 401 + WWW-Authenticate', async () => {
    const result = await guard.authenticate(req());
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
      expect(result.response.headers.get('WWW-Authenticate')).toContain('oauth-protected-resource');
    }
  });

  it('serves protected-resource metadata listing the authorization server', async () => {
    const res = guard.handleMetadata(req({}, guard.metadataPath));
    expect(res).not.toBeNull();
    const body = await (res as Response).json();
    expect(body.resource).toBe('https://api.example.com/mcp');
    expect(body.authorization_servers).toEqual(['https://auth.example.com']);
  });

  it('returns null from handleMetadata for non-metadata paths', () => {
    expect(guard.handleMetadata(req())).toBeNull();
  });

  it('rejects a token with the wrong audience (403)', async () => {
    const result = await guard.authenticate(req({ authorization: 'Bearer wrong-aud' }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(403);
    }
  });

  it('accepts a valid token with the right audience', async () => {
    const result = await guard.authenticate(req({ authorization: 'Bearer good' }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.claims.scope).toBe('mcp');
    }
  });
});
