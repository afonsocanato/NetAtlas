// Hostnames/mDNS names arrive however the device (or router/DHCP table)
// reports them — often all lowercase ("iphone", "johnsmith-pc", "mac").
// Title-cases each word/segment for display, without touching the
// underlying data (search, the raw hostname field, etc. use the original
// string). A small dictionary restores the "real" capitalization for common
// brand names a generic title-case can't guess (iphone -> iPhone, not
// Iphone).
const KNOWN_WORDS = {
  iphone: 'iPhone',
  ipad: 'iPad',
  imac: 'iMac',
  ipod: 'iPod',
  macbook: 'MacBook',
  macmini: 'Mac mini',
  appletv: 'Apple TV',
  homepod: 'HomePod',
  tv: 'TV',
  pc: 'PC',
  wifi: 'WiFi',
};

export function formatDeviceName(name) {
  if (!name) return name;
  return name
    .split(/([\s._-]+)/) // keep separators so we can rejoin them as-is
    .map((segment) => {
      if (/^[\s._-]+$/.test(segment)) return segment;

      const known = KNOWN_WORDS[segment.toLowerCase()];
      if (known) return known;

      // Leave segments that already mix case (e.g. "iPhone14", "MacBook")
      // alone — only fix segments that are uniformly upper or lower case.
      if (segment !== segment.toLowerCase() && segment !== segment.toUpperCase()) return segment;
      return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
    })
    .join('');
}
