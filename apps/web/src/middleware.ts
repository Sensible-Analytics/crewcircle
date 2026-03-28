import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/login',
  '/signup',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/demo(.*)',
  '/demo-login(.*)',
  '/forgot-password(.*)',
  '/update-password(.*)',
  '/blog(.*)',
  '/privacy',
  '/terms',
  '/roster',
  '/api/demo(.*)',
  '/api/user/profile(.*)',
  '/api/checkout(.*)',
  '/api/invite(.*)',
  '/auth/callback(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
