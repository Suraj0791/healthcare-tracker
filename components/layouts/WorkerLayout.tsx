'use client'

import React from 'react'
import { Layout, Menu, Avatar, Dropdown, Button } from 'antd'
import { 
  HomeOutlined, 
  HistoryOutlined, 
  UserOutlined, 
  LogoutOutlined 
} from '@ant-design/icons'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@auth0/nextjs-auth0/client'

const { Header, Content, Footer } = Layout

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useUser()
  
  const menuItems = [
    {
      key: '/worker',
      icon: <HomeOutlined />,
      label: <Link href="/worker">Home</Link>,
    },
    {
      key: '/worker/history',
      icon: <HistoryOutlined />,
      label: <Link href="/worker/history">Shift History</Link>,
    }
  ]
  
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: <Link href="/api/auth/logout">Logout</Link>,
    },
  ]
  
  return (
    <Layout className="min-h-screen">
      <Header className="bg-white p-0 px-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center h-full">
          <Link href="/worker" className="text-xl font-bold text-blue-700 mr-8">
            Health Staff Tracker
          </Link>
          <Menu
            theme="light"
            mode="horizontal"
            selectedKeys={[pathname]}
            items={menuItems}
            style={{ border: 'none' }}
          />
        </div>
        <div className="flex items-center">
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div className="flex items-center cursor-pointer">
              <span className="mr-2 hidden md:inline">{user?.name}</span>
              <Avatar icon={<UserOutlined />} src={user?.picture} />
            </div>
          </Dropdown>
        </div>
      </Header>
      <Content className="p-4">
        <div className="bg-white p-6 rounded-lg shadow-sm min-h-[calc(100vh-180px)]">
          {children}
        </div>
      </Content>
      <Footer className="text-center">
        Healthcare Staff Tracker ©{new Date().getFullYear()}
      </Footer>
    </Layout>
  )
}
