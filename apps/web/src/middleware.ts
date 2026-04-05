import { NextResponse, type NextRequest } from "next/server";

// Skip auth entirely if Clerk keys not configured
const isClerkConfigured =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.CLERK_SECRET_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("placeholder");

export async function middleware(request: NextRequest) {
  // If Clerk is configured, use it (would need proper implementation)
  if (isClerkConfigured) {
    // For now, allow all - Clerk integration needs full setup
    return NextResponse.next();
  }

  // Without Clerk configured, allow all requests
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
