import { NextResponse, type NextRequest } from "next/server";

/**
 * Optional site-wide password for the hosted demo. When SITE_PASSWORD is set,
 * every page asks for it (any username). Unset locally, so nothing changes there.
 */
export function middleware(request: NextRequest) {
  const password = process.env.SITE_PASSWORD;
  if (!password) return NextResponse.next();
  const header = request.headers.get("authorization") ?? "";
  if (header.startsWith("Basic ")) {
    const decoded = atob(header.slice(6));
    if (decoded.slice(decoded.indexOf(":") + 1) === password) return NextResponse.next();
  }
  return new NextResponse("Password required.", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="AI Trace"' } });
}

export const config = { matcher: "/((?!_next/static|_next/image|favicon.ico).*)" };
