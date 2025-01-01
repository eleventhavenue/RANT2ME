// middleware.ts
import { auth } from "./app/auth"
 
export default auth((req) => {
  const isLoggedIn = !!req.auth
  const authRoutes = ['/login', '/register']
  const isAuthPage = authRoutes.includes(req.nextUrl.pathname)
  
  if (isAuthPage) {
    if (isLoggedIn) {
      return Response.redirect(new URL('/', req.nextUrl))
    }
    return null
  }

  if (!isLoggedIn) {
    return Response.redirect(new URL('/login', req.nextUrl))
  }
  return null
})

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
}