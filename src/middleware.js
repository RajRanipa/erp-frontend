import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const ACCESS_COOKIE_NAME = 'accessToken';
const JWT_SECRET = process.env.JWT_ACCESS_SECRET;

// Public routes that don't require auth
const PUBLIC_PATHS = ['/', '/login', '/signup', '/api', '/favicon.ico', '/_next', '/accept-invite'];

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

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow static assets and Next internals
  if (isStaticAsset(pathname)) return NextResponse.next();

  // Allow public API and public paths
  if (pathname.startsWith('/api/public') || PUBLIC_PATHS.includes(pathname)) {
    // If user is on auth pages and has token, handle redirect below
    // otherwise allow public routes to continue
  }

  const tokenCookie = request.cookies.get(ACCESS_COOKIE_NAME);
  const token = tokenCookie?.value || null;

  // If user visits /login or /signup and already has a token, redirect based on setup state
  if ((pathname === '/login' || pathname === '/signup') && token) {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
      const isSetupCompleted = !!payload.isSetupCompleted;
      return NextResponse.redirect(new URL(isSetupCompleted ? '/dashboard' : '/setup', request.url));
    } catch (err) {
      // invalid token - allow them to see login/signup
      return NextResponse.next();
    }
  }

  // Allow general public routes (non-auth) without token
  if (PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/api/public')) {
    return NextResponse.next();
  }

  // Protected routes require a token
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));

    const isSetupCompleted = !!payload.isSetupCompleted;
    const isSetupRoute = pathname === '/setup' || pathname.startsWith('/setup/');

    if (!isSetupCompleted && !isSetupRoute) {
      return NextResponse.redirect(new URL('/setup', request.url));
    }

    if (isSetupCompleted && isSetupRoute) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Attach lightweight headers for downstream SSR (optional)
    const response = NextResponse.next();
    if (payload.id) response.headers.set('x-user-id', String(payload.id));
    if (payload.companyId) response.headers.set('x-company-id', String(payload.companyId));
    if (payload.role) response.headers.set('x-role', String(payload.role));

    return response;
  } catch (err) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/:path*'],
};