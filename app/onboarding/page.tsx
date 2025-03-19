import { getSession } from '@auth0/nextjs-auth0'
import { redirect } from 'next/navigation'
import OnboardingForm from '@/components/OnboardingForm'

export default async function OnboardingPage() {
  const session = await getSession()
  
  if (!session?.user) {
    redirect('/api/auth/login')
  }
  
  // If the user already has a role, redirect to their dashboard
  if (session.user.role) {
    if (session.user.role === 'MANAGER') {
      redirect('/manager')
    } else {
      redirect('/worker')
    }
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <OnboardingForm userId={session.user.sub} />
    </div>
  )
}
