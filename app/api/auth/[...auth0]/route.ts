import { handleAuth, handleCallback, handleLogin } from '@auth0/nextjs-auth0'
import { NextRequest } from 'next/server'

export const GET = handleAuth({
  login: handleLogin({
    returnTo: '/',
  }),
  callback: handleCallback({
    afterCallback: async (req, res, session) => {
      return session
    },
  }),
})

export const POST = (req: NextRequest) => {
  return new Response('Not implemented', { status: 405 })
}
