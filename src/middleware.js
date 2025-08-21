import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC_ROUTES = ['/', '/login', '/signup'];
const JWT_SECRET = process.env.JWT_ACCESS_SECRET;
console.log('JWT_SECRET loaded:', JWT_SECRET);

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Bypass middleware for Next internals and static assets (so /pngegg.png works)
  const isStaticAsset = (
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/favicon-') ||
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/public/') ||
    pathname.startsWith('/.well-known/') ||
    /\.(png|jpg|jpeg|gif|webp|svg|ico|txt|json|css|js|map)$/i.test(pathname)
  );
  if (isStaticAsset) {
    return NextResponse.next();
  }

  const tokenCookie = request.cookies.get('accessToken');
  const token = tokenCookie?.value;

  console.log('Middleware running for pathname:', pathname);
  console.log('Cookie accessToken:', tokenCookie);

  if (PUBLIC_ROUTES.includes(pathname) && (pathname === '/login' || pathname === '/signup') && token) {
    try {
      console.log('Token present on public auth page:', token);
      const verfy = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
      console.log('Token verified successfully:', verfy);
      console.log('Redirecting to /dashboard');
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch (err) {
      console.log('Invalid or expired token on public auth page:', err);
    }
  }

  if (PUBLIC_ROUTES.includes(pathname)) {
    console.log('Public route accessed, proceeding without auth check');
    return NextResponse.next();
  }

  if (!token) {
    console.log('No token found for protected route:', pathname);
    console.log('Redirecting to /login');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    console.log('Token valid for protected route:', pathname);
    console.log('Proceeding to next');
    return NextResponse.next();
  } catch (err) {
    console.error('JWT verification failed:', err);
    console.log('Redirecting to /login due to invalid or expired token');
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    '/:path*',
  ],
};