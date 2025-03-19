'use client'

import React from 'react'
import { Button, Typography, Space, Row, Col, Card } from 'antd'
import { ClockCircleOutlined, TeamOutlined, LineChartOutlined } from '@ant-design/icons'
import Link from 'next/link'

const { Title, Paragraph } = Typography

export default function LandingPage() { 
  return (
    <div className="min-h-screen">
      <div className="bg-blue-700 text-white py-20">
        <div className="container mx-auto px-4">
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} md={12}>
              <Title level={1} style={{ color: 'white', marginBottom: '24px' }}>
                Healthcare Staff Clock In/Out System
              </Title>
              <Paragraph style={{ color: 'white', fontSize: '18px', marginBottom: '32px' }}>
                Streamline attendance tracking for healthcare workers with geolocation-based clock in/out functionality.
              </Paragraph>
              <Space>
                <Link href="/api/auth/login">
                  <Button type="primary" size="large">
                    Log In
                  </Button>
                </Link>
                <Link href="/api/auth/login">
                  <Button size="large">
                    Sign Up
                  </Button>
                </Link>
              </Space>
            </Col>
            <Col xs={24} md={12}>
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <img 
                  src="/placeholder.svg?height=300&width=500" 
                  alt="Healthcare dashboard preview" 
                  className="w-full h-auto rounded"
                />
              </div>
            </Col>
          </Row>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <Title level={2} className="text-center mb-12">
          Key Features
        </Title>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={8}>
            <Card className="h-full shadow-md hover:shadow-lg transition-shadow">
              <ClockCircleOutlined className="text-blue-600 text-4xl mb-4" />
              <Title level={4}>Geolocation Clock In/Out</Title>
              <Paragraph>
                Verify staff are at the correct location when clocking in or out with geolocation perimeter settings.
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card className="h-full shadow-md hover:shadow-lg transition-shadow">
              <TeamOutlined className="text-blue-600 text-4xl mb-4" />
              <Title level={4}>Staff Management</Title>
              <Paragraph>
                View real-time data on who's currently working, when they clocked in, and detailed shift history.
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card className="h-full shadow-md hover:shadow-lg transition-shadow">
              <LineChartOutlined className="text-blue-600 text-4xl mb-4" />
              <Title level={4}>Analytics Dashboard</Title>
              <Paragraph>
                Track hours worked, attendance patterns, and view detailed reports to optimize staffing.
              </Paragraph>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  )
}
