import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/middleware'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - api         (Route Handlers — pakai x-device-key sendiri)
     * - _next/static  (static files)
     * - _next/image   (image optimisation)
     * - favicon.ico   (browser favicon)
     * - public assets (svg, png, jpg, …)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
