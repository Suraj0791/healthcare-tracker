'use client'

import React, { useState } from 'react'
import { Form, Button, Radio, Typography, Card, Spin, message } from 'antd'
import { useMutation, gql } from '@apollo/client'
import { useRouter } from 'next/navigation'

const { Title, Paragraph } = Typography

const SET_USER_ROLE = gql`
  mutation SetUserRole($userId: String!, $role: String!) {
    setUserRole(userId: $userId, role: $role) {
      id
      role
    }
  }
`

export default function OnboardingForm({ userId }: { userId: string }) {
  const [form] = Form.useForm()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const [setUserRole] = useMutation(SET_USER_ROLE, {
    onCompleted: (data) => {
      setLoading(false)
      
      if (data.setUserRole.role === 'MANAGER') {
        router.push('/manager')
      } else {
        router.push('/worker')
      }
      
      message.success('Profile setup complete!')
    },
    onError: (error) => {
      setLoading(false)
      message.error('Failed to set up profile: ' + error.message)
    }
  })
  
  const onFinish = (values: any) => {
    setLoading(true)
    setUserRole({
      variables: {
        userId,
        role: values.role
      }
    })
  }
  
  return (
    <Card className="max-w-lg mx-auto shadow-lg">
      <Spin spinning={loading}>
        <div className="text-center mb-8">
          <Title level={2}>Welcome to Healthcare Staff Tracker</Title>
          <Paragraph>
            Please select your role to complete your account setup.
          </Paragraph>
        </div>
        
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ role: 'WORKER' }}
        >
          <Form.Item
            name="role"
            label="What is your role?"
            rules={[{ required: true, message: 'Please select your role' }]}
          >
            <Radio.Group>
              <Radio.Button value="MANAGER">Manager</Radio.Button>
              <Radio.Button value="WORKER">Care Worker</Radio.Button>
            </Radio.Group>
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large">
              Complete Setup
            </Button>
          </Form.Item>
        </Form>
      </Spin>
    </Card>
  )
}
