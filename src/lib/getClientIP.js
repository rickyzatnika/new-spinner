// Function to get client IP address
export function getClientIP(request) {
    // Try to get IP from various headers (for proxies, load balancers, etc.)
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfConnectingIP = request.headers.get('cf-connecting-ip'); // Cloudflare
    
    let ip = null;
    
    if (forwarded) {
      // x-forwarded-for can contain multiple IPs, take the first one
      ip = forwarded.split(',')[0].trim();
    } else if (realIP) {
      ip = realIP.trim();
    } else if (cfConnectingIP) {
      ip = cfConnectingIP.trim();
    }
    
    // Normalize localhost IPs (::1 is IPv6 localhost, 127.0.0.1 is IPv4 localhost)
    if (ip === '::1' || ip === '127.0.0.1' || ip === 'localhost') {
      ip = '127.0.0.1'; // Normalize to IPv4 localhost
    }
    
    return ip || 'unknown';
  }
  