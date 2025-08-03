import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC_ROUTES = ['/', '/login', '/signup'];

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = await request.cookies.get('accessToken')?.value;

  console.log('Middleware is running for:', pathname);

  // ✅ If visiting login or signup but already logged in → redirect
  if ((pathname === '/login' || pathname === '/signup') && token) {
    try {
      console.log('token 1 : ', token);
      const verfy = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_ACCESS_SECRET));
      console.log('verfy : ', verfy);
      return NextResponse.redirect(new URL('/dashboard', request.url)); // or '/'
    } catch (err) {
      console.log('Invalid token on public page:', err);
    }
  }
  console.log('token 2 : ', token); // token 2 : undefined
  // ✅ Skip auth check for public pages
  if (['/', '/login', '/signup'].includes(pathname)) {
    return NextResponse.next();
  }

  // 🔒 For protected routes
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    await jwtVerify(token, new TextEncoder().encode(process.env.JWT_ACCESS_SECRET));
    return NextResponse.next();
  } catch (err) {
    console.error('JWT Error:', err);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - static files (/_next/, /images/, etc.)
     * - API routes
     * - auth routes like /login or /signup
     */
    '/((?!_next/static|_next/image|favicon.ico|logo.png|login|signup|api).*)',
  ],
};