import { redirect } from 'next/navigation'
import { getSession } from '@auth0/nextjs-auth0'
import LandingPage from '@/components/LandingPage'

export default async function Home() {
  const session = await getSession()
  
  if (session?.user) {
    // Check if the user has a role set, if not, redirect to onboarding
    if (!session.user.role) {
      redirect('/onboarding')
    }
    
    // Redirect to their role-specific dashboard
    if (session.user.role === 'MANAGER') {
      redirect('/manager')
    } else {
      redirect('/worker')
    }
  }
  
  return <LandingPage />
}
