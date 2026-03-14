export type PageKind = 'crm' | 'auth' | 'property' | 'capture' | 'marketplace';

const CRM_PREFIXES = [
  '/dashboard',
  '/crm',
  '/leads',
  '/pipeline',
  '/visits',
  '/conversations',
  '/messages',
  '/bookings',
  '/analytics',
  '/historical',
  '/notifications',
  '/follow-ups',
  '/owners',
  '/inventory',
  '/availability',
  '/effort',
  '/matching',
  '/zones',
  '/profile',
  '/settings'
];

export function getPageKind(pathname: string): PageKind {
  if (CRM_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return 'crm';
  }

  if (pathname.startsWith('/auth')) {
    return 'auth';
  }

  if (pathname.startsWith('/property/')) {
    return 'property';
  }

  if (pathname.startsWith('/capture')) {
    return 'capture';
  }

  return 'marketplace';
}
