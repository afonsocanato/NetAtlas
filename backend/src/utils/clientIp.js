// Best-effort real client IP through the proxy chain (Cloudflare Tunnel ->
// local Caddy -> this backend). CF-Connecting-IP is set by Cloudflare's edge
// and can't be spoofed by the client; X-Forwarded-For (set by Caddy's
// reverse_proxy) is the fallback for non-Cloudflare deployments; req.ip is
// the last resort for plain local access.
export function clientIp(req) {
  const cfIp = req.header('CF-Connecting-IP');
  if (cfIp) return cfIp;

  const forwarded = req.header('X-Forwarded-For');
  if (forwarded) return forwarded.split(',')[0].trim();

  return req.ip;
}
