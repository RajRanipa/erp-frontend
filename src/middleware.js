import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const ACCESS_COOKIE_NAME = 'accessToken';
const JWT_SECRET = process.env.JWT_ACCESS_SECRET;

// ---------- Public & Static ----------
const PUBLIC_PATHS = [
  '/', '/login', '/signup', '/api', '/favicon.ico', '/_next',
  '/accept-invite', '/403',
];

// Static / assets detection
function isStaticAsset(pathname) {
  return (
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/favicon-') ||
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/public/') ||
    pathname.startsWith('/.well-known/') ||
    /\.(png|jpg|jpeg|gif|webp|svg|ico|txt|json|css|js|map)$/i.test(pathname)
  );
}

// ---------- Route → Permission Map (extend as you add pages) ----------
const ROUTE_PERM = [
  'dashboard',
  'inventory',
  'items',
  'manufacturing',
  'crm',
  'warehouse',
  'users',
];

function requiredPermFor(pathname) {
  // Longest-prefix match so /inventory/stock matches '/inventory'
  const key = ROUTE_PERM.find(prefix => pathname.startsWith('/' + prefix));
  return key ? key : null;
}

function firstAllowedRoute(perms = []) {
  // const entries = Object.entries(ROUTE_PERM);
  const entries = ROUTE_PERM
  // console.log("entries", entries, perms)
  const hit = entries.filter((route) =>{
    // console.log("route, need", route, perms.join(',').includes(route))
    // allow exact match
    if(perms.join(',').includes(route)) return route;
    // // allow full access variants like items:full, inventory:full, etc.
    // (need.endsWith(':read') && perms.includes(need.replace(':read', ':full'))) ||
    // (need.endsWith(':any') && (perms.includes(need) || perms.includes(need.replace(':any', ':full'))))
});
  console.log("hit", hit)
  return hit ? hit[0] : '/403';
}

export async function middleware(request) {
  const { pathname, search } = request.nextUrl;
  // Allow static assets and Next internals
  if (isStaticAsset(pathname)) return NextResponse.next();
  
  // Allow public API and explicit public paths
  const isPublicApi = pathname.startsWith('/api/public');
  const isPublicPath = PUBLIC_PATHS.includes(pathname) || isPublicApi;
  // NOTE: we don't early-return here for /login & /signup because we want to
  // possibly redirect authenticated users away from auth pages.
  
  const tokenCookie = request.cookies.get(ACCESS_COOKIE_NAME);
  const token = tokenCookie?.value || null;
  
  // If user visits /login or /signup and already has a token, redirect based on setup & permissions
  if ((pathname === '/login' || pathname === '/signup') && token) {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
      const isSetupCompleted = !!payload.isSetupCompleted;
      const perms = Array.isArray(payload.permissions) ? payload.permissions : [];
      const target = isSetupCompleted ? firstAllowedRoute(perms) : '/setup';
      return NextResponse.redirect(new URL(target, request.url));
    } catch {
      // invalid/expired token - allow them to see login/signup
      return NextResponse.next();
    }
  }

  // Allow general public routes (non-auth) without token
  
  if (isPublicPath) {
    return NextResponse.next();
  }
  
  // Protected routes require a token
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    if (pathname && pathname !== '/') {
      url.searchParams.set('next', pathname + (search || ''));
    }
    return NextResponse.redirect(url);
  }
  
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    
    const isSetupCompleted = !!payload.isSetupCompleted;
    const isSetupRoute = pathname === '/setup' || pathname.startsWith('/setup/');
    
    // Setup flow enforcement
    if (!isSetupCompleted && !isSetupRoute) {
      return NextResponse.redirect(new URL('/setup', request.url));
    }
    
    if (isSetupCompleted && isSetupRoute) {
      const perms = Array.isArray(payload.permissions) ? payload.permissions : [];
      const target = firstAllowedRoute(perms);
      return NextResponse.redirect(new URL(target, request.url));
    }
    
    // Permission guard (page-level)
    const need = requiredPermFor(pathname);
    // console.log('pathname 11', pathname);
    // console.log('need 12', pathname , need);
    if (need) {
      const perms = Array.isArray(payload.permissions) ? payload.permissions : [];
      const allowed =
      perms.join(',').includes(need) ||
      (need.endsWith(':read') && perms.includes(need.replace(':read', ':full'))) ||
      (need.endsWith(':any') && (perms.includes(need) || perms.includes(need.replace(':any', ':full'))));
      
      // console.log('perms.includes(need) 13', perms.join(',').includes(need));
      // console.log('allowed 33', allowed);

      if (!allowed) {
        const url = request.nextUrl.clone();
        url.pathname = '/403';
        url.search = '';
        return NextResponse.redirect(url);
      }
    }

    // Attach lightweight headers for downstream SSR (optional)
    const response = NextResponse.next();
    if (payload.id) response.headers.set('x-user-id', String(payload.id));
    if (payload.companyId) response.headers.set('x-company-id', String(payload.companyId));
    if (payload.role) response.headers.set('x-role', String(payload.role));

    return response;
  } catch {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    return NextResponse.redirect(url);
  }
}

export const config = {
  // run on all pages; APIs are excluded in-logic (we only skip /api/public here)
  matcher: ['/:path*'],
};