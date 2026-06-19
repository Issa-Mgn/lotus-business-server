

/**
 * Récupère l'adresse IP réelle du client
 * Gère les proxies, load balancers, etc.
 */
function getClientIp(req) {
  // Priorité aux headers de proxy/load balancer
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // x-forwarded-for peut contenir plusieurs IPs, prendre la première
    return forwardedFor.split(',')[0].trim();
  }

  // Autres headers possibles
  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return realIp;
  }

  // Cloudflare
  const cfConnectingIp = req.headers['cf-connecting-ip'];
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback sur l'IP de la connexion directe
  return req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
}

module.exports = getClientIp;
