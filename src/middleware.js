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
  { route: '/dashboard', perm: 'dashboard:read' },
  { route: '/inventory', perm: 'inventory:read' },
  { route: '/inventory/create', perm: [
    'inventory:adjust',
    'inventory:issue',
    'inventory:receipt',
    'inventory:transfer',
    'inventory:repack',
  ] },
  { route: '/items', perm: 'items:read' },
  { route: '/items/create', perm: 'items:create' },
  { route: '/items/edit/', perm: 'items:update' }, // what i can do for path like this '/items/edit/:id' becuse :id string will change dynamically like this /items/edit/6909c8b91b7a3946d1bd20e4
  { route: '/manufacturing', perm: 'manufacturing:read' },
  { route: '/crm', perm: 'crm:read' },
  { route: '/warehouse', perm: 'warehouse:read' },
  { route: '/users', perm: 'users:read' },
  { route: '/users/manage', perm: ['users:invite:read', 'users:invite:resend','users:invite:revoke', 'users:remove'] },
  { route: '/settings', perm: 'settings:read' },
  { route: '/settings/role&permisstions', perm: [
    'roles:read',
    'users:permissions:read',
    'users:permissions:create',
    'users:permissions:update',
    'users:permissions:delete',
  ] },
];

function hasPermission(perm, perms = []) {
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
  // Longest-prefix match so /inventory/stock matches '/inventory'
  let match = null;

  for (const entry of ROUTE_PERM) {
    const routePrefix = entry.route;
    const isExact = pathname === routePrefix;

    // Prefix match for child paths: /items/edit/123
    const isChild = pathname.startsWith(routePrefix.endsWith('/')
      ? routePrefix               // '/items/edit/' → '/items/edit/123'
      : routePrefix + '/'         // '/items/edit' → '/items/edit/123'
    );

    if (isExact || isChild) {
      // Longest-prefix wins, e.g. /items vs /items/edit
      if (!match || routePrefix.length > match.route.length) {
        match = entry;
      }
    }
  }

  return match ? match.perm : null;
}

function firstAllowedRoute(perms = []) {
  for (const { route, perm } of ROUTE_PERM) {
    if (hasPermission(perm, perms)) {
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

    if (need) {
      const perms = Array.isArray(payload.permissions) ? payload.permissions : [];
      const allowed = hasPermission(need, perms);

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