import { getSession } from '@auth0/nextjs-auth0'
import { redirect } from 'next/navigation'
import ManagerLayout from '@/components/layouts/ManagerLayout'

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  
  if (!session?.user) {
    redirect('/api/auth/login')
  }
  
  if (session.user.role !== 'MANAGER') {
    redirect('/worker')
  }
  
  return <ManagerLayout>{children}</ManagerLayout>
}
