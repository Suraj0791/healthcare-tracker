'use client'

import React, { useState } from 'react'
import { Layout, Menu, Avatar, Dropdown, Button } from 'antd'
import { 
  DashboardOutlined, 
  TeamOutlined, 
  SettingOutlined, 
  UserOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  LogoutOutlined
} from '@ant-design/icons'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@auth0/nextjs-auth0/client'

const { Header, Sider, Content } = Layout

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { user } = useUser()
  
  const items = [
    {
      key: '/manager',
      icon: <DashboardOutlined />,
      label: <Link href="/manager">Dashboard</Link>,
    },
    {
      key: '/manager/staff',
      icon: <TeamOutlined />,
      label: <Link href="/manager/staff">Staff</Link>,
    },
    {
      key: '/manager/settings',
      icon: <SettingOutlined />,
      label: <Link href="/manager/settings">Settings</Link>,
    },
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
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        theme="light" 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        breakpoint="lg"
        collapsedWidth={80}
        onBreakpoint={(broken) => {
          if (broken) {
            setCollapsed(true)
          }
        }}
      >
        <div className="p-4 flex items-center justify-center border-b border-gray-200">
          <Link href="/manager" className="text-xl font-bold text-blue-700">
            {collapsed ? 'HST' : 'Health Staff Tracker'}
          </Link>
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[pathname]}
          items={items}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header className="bg-white p-0 px-4 flex justify-between items-center shadow-sm">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
          <div className="flex items-center">
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className="flex items-center cursor-pointer">
                <span className="mr-2 hidden md:inline">{user?.name}</span>
                <Avatar icon={<UserOutlined />} src={user?.picture} />
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content className="m-4 p-4 bg-white rounded-lg overflow-auto">
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}
