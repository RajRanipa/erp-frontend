import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const ACCESS_COOKIE_NAME = 'accessToken';
const JWT_SECRET = process.env.JWT_ACCESS_SECRET;

// ---------- Public & Static ----------
const PUBLIC_PATHS = [
  '/', '/login', '/signup', '/forgot-password', '/api', '/favicon.ico', '/_next',
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
  { route: '/dashboard', perm: 'dashboard:read' },
  { route: '/inventory', perm: 'inventory:read' },
  { route: '/procurement', perm: 'procurement:read' },
  { route: '/procurement/orders/new', perm: 'procurement:create' },
  { route: '/procurement/receipts/new', perm: 'procurement:receive' },
  { route: '/procurement/returns/new', perm: 'procurement:return' },
  { route: '/procurement/invoices/new', perm: 'procurement:invoice' },
  { route: '/items', perm: 'items:read' },
  { route: '/items/catalog/create', perm: 'items:create' },
  { route: '/manufacturing', perm: 'manufacturing:read' },
  { route: '/crm', perm: 'crm:read' },
  { route: '/warehouse', perm: 'warehouse:read' },
  { route: '/users', perm: 'users:read' },
  { route: '/users/invite', perm: ['users:invite:read', 'users:invite:create'] },
  { route: '/settings', perm: 'settings:read' },
  { route: '/settings/myaccount', perm: null },
  { route: '/settings/role&permisstions', perm: [
    'roles:read',
    'permissions:read',
  ] },
];

const DYNAMIC_ROUTE_PERM = [
  {
    pattern: /^\/procurement\/orders\/[^/]+\/edit\/?$/,
    perm: 'procurement:update',
  },
  {
    pattern: /^\/procurement\/receipts\/[^/]+\/edit\/?$/,
    perm: 'procurement:receive',
  },
  {
    pattern: /^\/procurement\/returns\/[^/]+\/edit\/?$/,
    perm: 'procurement:return',
  },
  {
    pattern: /^\/procurement\/invoices\/[^/]+\/edit\/?$/,
    perm: 'procurement:invoice',
  },
];

function hasPermission(perm, perms = [], isOwner = false) {
  if (isOwner) return true;
  if (!perm) return false;
  const allowedSet = new Set(perms);

  const checkOne = (single) => {
    if (!single) return false;
    if (allowedSet.has(single)) return true;
    const parts = String(single).split(':').filter(Boolean);
    const resource = parts[0];
    if (allowedSet.has(`${resource}:full`)) return true;
    return false;
  };

  if (Array.isArray(perm)) {
    // Any one permission in the array is enough
    return perm.some(checkOne);
  }

  return checkOne(perm);
}

function requiredPermFor(pathname) {
  const dynamicMatch = DYNAMIC_ROUTE_PERM.find(entry => entry.pattern.test(pathname));
  if (dynamicMatch) return dynamicMatch.perm;
  // Longest-prefix match so /inventory/stock matches '/inventory'
  let match = null;

  for (const entry of ROUTE_PERM) {
    const routePrefix = entry.route;
    const isExact = pathname === routePrefix;

    // Prefix match for child paths such as /items/catalog/123.
    const isChild = pathname.startsWith(routePrefix.endsWith('/')
      ? routePrefix
      : routePrefix + '/'
    );

    if (isExact || isChild) {
      // Longest-prefix wins, e.g. /items vs /items/catalog/create.
      if (!match || routePrefix.length > match.route.length) {
        match = entry;
      }
    }
  }

  return match ? match.perm : null;
}

function firstAllowedRoute(perms = [], isOwner = false) {
  for (const { route, perm } of ROUTE_PERM) {
    if (perm && hasPermission(perm, perms, isOwner)) {
      return route;
    }
  }
  return '/403';
}

export async function middleware(request) {
  const { pathname, search } = request.nextUrl;
  // Allow static assets and Next internals
  if (isStaticAsset(pathname)) return NextResponse.next();

  // Allow public API and explicit public paths
  const isPublicApi = pathname.startsWith('/api/public');
  const isPublicTrace = pathname === '/trace' || pathname.startsWith('/trace/');
  const isPublicPath = PUBLIC_PATHS.includes(pathname) || isPublicApi || isPublicTrace;
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
      const target = isSetupCompleted ? firstAllowedRoute(perms, Boolean(payload.isOwner)) : '/setup';
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
      const target = firstAllowedRoute(perms, Boolean(payload.isOwner));
      return NextResponse.redirect(new URL(target, request.url));
    }

    // Permission guard (page-level)
    const need = requiredPermFor(pathname);
    // console.log('pathname 11', pathname);

    if (need) {
      const perms = Array.isArray(payload.permissions) ? payload.permissions : [];
      const allowed = hasPermission(need, perms, Boolean(payload.isOwner));

      // console.log('PATH:', pathname);
      // console.log('NEED:', need);
      // console.log('PERMS:', perms);
      // console.log('ALLOWED:', allowed);
      // console.log('payload.role',payload.role);
      // console.log('allowed 33', allowed);

      if (!allowed) {
        const url = request.nextUrl.clone();
        url.pathname = '/403';
        url.search = '';
        return NextResponse.redirect(url);
      }
    }
    // if(!need){
    //   console.log('no need');
    //   const url = request.nextUrl.clone();
    //     url.pathname = '/403';
    //     url.search = '';
    //     return NextResponse.redirect(url);
    // }

    // Attach lightweight headers for downstream SSR (optional)
    const response = NextResponse.next();
    if (payload.userId) response.headers.set('x-user-id', String(payload.userId));
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
