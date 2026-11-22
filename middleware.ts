import { next } from '@vercel/functions'

const blockedCrawler = /\b(?:GPTBot|ClaudeBot|CCBot)\b/i

export default function middleware(request: Request) {
  const { pathname } = new URL(request.url)
  // API clients and crawlers fetching our published policy use normal routing.
  if (pathname === '/robots.txt' || pathname === '/api' || pathname.startsWith('/api/')) return next()

  if (blockedCrawler.test(request.headers.get('user-agent') ?? '')) {
    return new Response('Access denied by the RoboLab Studio crawler policy.', {
      status: 403,
      headers: {
        'Cache-Control': 'private, no-store',
        'Content-Type': 'text/plain; charset=utf-8',
        'Vary': 'User-Agent',
      },
    })
  }

  return next()
}

export const config = {
  matcher: ['/((?!api(?:/|$)|robots\\.txt$).*)'],
}
