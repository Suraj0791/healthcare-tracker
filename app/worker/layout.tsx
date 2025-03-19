import { getSession } from '@auth0/nextjs-auth0'
import { redirect } from 'next/navigation'
import WorkerLayout from '@/components/layouts/WorkerLayout'

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  
  if (!session?.user) {
    redirect('/api/auth/login')
  }
  
  if (session.user.role !== 'WORKER') {
    redirect('/manager')
  }
  
  return <WorkerLayout>{children}</WorkerLayout>
}
