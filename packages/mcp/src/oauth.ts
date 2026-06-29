// @agentora/mcp/oauth — OAuth 2.1 resource-server protection for the MCP HTTP
// transport. agentora is only a *resource server*: it advertises its
// authorization server(s), challenges unauthenticated requests, and validates
// the bearer token's audience. Token issuance is out of scope (use Better Auth,
// an external IdP, etc.). stdio needs no auth and never touches this.

const METADATA_PATH = '/.well-known/oauth-protected-resource';

export interface TokenClaims {
  /** Audience — must include this server's canonical resource URI (RFC 8707/9068). */
  aud?: string | string[];
  scope?: string;
  [claim: string]: unknown;
}

export interface OAuthOptions {
  /** This server's canonical resource URI — the expected token audience. */
  resource: string;
  /** Authorization server issuer URL(s) clients should use. */
  authorizationServers: string[];
  /** Verify a bearer token; return claims when valid, else null. */
  verifyToken: (token: string) => Promise<TokenClaims | null> | TokenClaims | null;
}

export type AuthResult = { ok: true; claims: TokenClaims } | { ok: false; response: Response };

/** RFC 9728 Protected Resource Metadata document. */
export function protectedResourceMetadata(opts: OAuthOptions): Record<string, unknown> {
  return {
    resource: opts.resource,
    authorization_servers: opts.authorizationServers,
    bearer_methods_supported: ['header'],
  };
}

function metadataUrl(opts: OAuthOptions): string {
  return `${opts.resource.replace(/\/+$/, '')}${METADATA_PATH}`;
}

function challenge(opts: OAuthOptions, error?: string): Response {
  const params = [`resource_metadata="${metadataUrl(opts)}"`];
  if (error) {
    params.push(`error="${error}"`);
  }
  return new Response(null, {
    status: 401,
    headers: { 'WWW-Authenticate': `Bearer ${params.join(', ')}` },
  });
}

function audienceMatches(aud: TokenClaims['aud'], resource: string): boolean {
  if (aud === undefined) {
    return false;
  }
  return Array.isArray(aud) ? aud.includes(resource) : aud === resource;
}

/** Build a resource-server guard for the MCP HTTP transport. */
export function oauthResourceServer(opts: OAuthOptions) {
  return {
    metadataPath: METADATA_PATH,

    /** Serve the discovery document when the path matches, else null. */
    handleMetadata(req: Request): Response | null {
      const url = new URL(req.url);
      if (url.pathname === METADATA_PATH) {
        return Response.json(protectedResourceMetadata(opts));
      }
      return null;
    },

    /** Authenticate a request: validate bearer presence, token, and audience. */
    async authenticate(req: Request): Promise<AuthResult> {
      const header = req.headers.get('authorization');
      if (!header?.startsWith('Bearer ')) {
        return { ok: false, response: challenge(opts) };
      }
      const claims = await opts.verifyToken(header.slice('Bearer '.length));
      if (!claims) {
        return { ok: false, response: challenge(opts, 'invalid_token') };
      }
      if (!audienceMatches(claims.aud, opts.resource)) {
        return {
          ok: false,
          response: new Response(JSON.stringify({ error: 'invalid_audience' }), {
            status: 403,
            headers: { 'content-type': 'application/json' },
          }),
        };
      }
      return { ok: true, claims };
    },
  };
}
