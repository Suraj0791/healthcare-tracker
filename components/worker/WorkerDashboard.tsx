'use client'

import React, { useEffect, useState } from 'react'
import { 
  Card, 
  Button, 
  Typography, 
  Spin, 
  Modal, 
  Form, 
  Input, 
  Result,
  Alert,
  Statistic,
  Row,
  Col
} from 'antd'
import { 
  LoginOutlined, 
  LogoutOutlined, 
  EnvironmentOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined
} from '@ant-design/icons'
import { gql, useQuery, useMutation } from '@apollo/client'
import { useGeolocation } from '@/context/GeolocationContext'
import { format } from 'date-fns'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

const GET_WORKER_STATUS = gql`
  query GetWorkerStatus {
    workerStatus {
      clockedIn
      lastClockIn {
        time
        location {
          latitude
          longitude
          address
        }
        note
      }
      canClockIn
      canClockInReason
      lastShiftDuration
      totalHoursThisWeek
    }
  }
`

const CLOCK_IN = gql`
  mutation ClockIn($input: ClockInInput!) {
    clockIn(input: $input) {
      success
      message
    }
  }
`

const CLOCK_OUT = gql`
  mutation ClockOut($input: ClockOutInput!) {
    clockOut(input: $input) {
      success
      message
    }
  }
`

export default function WorkerDashboard() {
  const [clockInModalVisible, setClockInModalVisible] = useState(false)
  const [clockOutModalVisible, setClockOutModalVisible] = useState(false)
  const [clockInForm] = Form.useForm()
  const [clockOutForm] = Form.useForm()
  const [resultVisible, setResultVisible] = useState(false)
  const [resultSuccess, setResultSuccess] = useState(false)
  const [resultMessage, setResultMessage] = useState('')
  
  const { location, loading: locationLoading, error: locationError } = useGeolocation()
  
  const { loading, error, data, refetch } = useQuery(GET_WORKER_STATUS, {
    fetchPolicy: 'network-only',
    pollInterval: 30000, // Poll every 30 seconds to keep status updated
  })
  
  const [clockInMutation, { loading: clockingIn }] = useMutation(CLOCK_IN, {
    onCompleted: (data) => {
      setClockInModalVisible(false)
      setResultVisible(true)
      setResultSuccess(data.clockIn.success)
      setResultMessage(data.clockIn.message)
      refetch()
      clockInForm.resetFields()
    },
    onError: (error) => {
      setClockInModalVisible(false)
      setResultVisible(true)
      setResultSuccess(false)
      setResultMessage(error.message)
    }
  })
  
  const [clockOutMutation, { loading: clockingOut }] = useMutation(CLOCK_OUT, {
    onCompleted: (data) => {
      setClockOutModalVisible(false)
      setResultVisible(true)
      setResultSuccess(data.clockOut.success)
      setResultMessage(data.clockOut.message)
      refetch()
      clockOutForm.resetFields()
    },
    onError: (error) => {
      setClockOutModalVisible(false)
      setResultVisible(true)
      setResultSuccess(false)
      setResultMessage(error.message)
    }
  })
  
  const handleClockIn = () => {
    if (!location) {
      setResultVisible(true)
      setResultSuccess(false)
      setResultMessage('Unable to get your location. Please enable location services and try again.')
      return
    }
    
    clockInForm.validateFields().then(values => {
      clockInMutation({
        variables: {
          input: {
            latitude: location.latitude,
            longitude: location.longitude,
            note: values.note || ''
          }
        }
      })
    })
  }
  
  const handleClockOut = () => {
    if (!location) {
      setResultVisible(true)
      setResultSuccess(false)
      setResultMessage('Unable to get your location. Please enable location services and try again.')
      return
    }
    
    clockOutForm.validateFields().then(values => {
      clockOutMutation({
        variables: {
          input: {
            latitude: location.latitude,
            longitude: location.longitude,
            note: values.note || ''
          }
        }
      })
    })
  }
  
  const formatDateTime = (timestamp: string) => {
    if (!timestamp) return 'N/A'
    return format(new Date(timestamp), 'MMM d, yyyy h:mm a')
  }
  
  const formatDuration = (minutes: number) => {
    if (!minutes) return '0h 0m'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }
  
  if (loading && !data) {
    return <Spin size="large" className="flex justify-center items-center h-64" />
  }
  
  const workerStatus = data?.workerStatus || {
    clockedIn: false,
    lastClockIn: null,
    canClockIn: false,
    canClockInReason: '',
    lastShiftDuration: 0,
    totalHoursThisWeek: 0
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <Title level={2} className="mb-6">Worker Dashboard</Title>
      
      {error && (
        <Alert
          message="Error loading status"
          description={error.message}
          type="error"
          showIcon
          className="mb-6"
        />
      )}
      
      {locationError && (
        <Alert
          message="Location Error"
          description={locationError.message}
          type="error"
          showIcon
          className="mb-6"
        />
      )}
      
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="Current Status"
              value={workerStatus.clockedIn ? "Clocked In" : "Clocked Out"}
              valueStyle={{ color: workerStatus.clockedIn ? '#3f8600' : '#cf1322' }}
              prefix={workerStatus.clockedIn ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="Hours This Week"
              value={workerStatus.totalHoursThisWeek / 60}
              precision={1}
              suffix="hrs"
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>
      
      <Card className="mb-6">
        <div className="flex items-center justify-center flex-col mb-4">
          {workerStatus.clockedIn ? (
            <>
              <div className="text-center mb-6">
                <CheckCircleOutlined className="text-6xl text-green-500 mb-2" />
                <Title level={3}>You are currently clocked in</Title>
                <Paragraph>
                  {workerStatus.lastClockIn && (
                    <span>Clocked in at: {formatDateTime(workerStatus.lastClockIn.time)}</span>
                  )}
                </Paragraph>
              </div>
              
              <Button 
                type="primary" 
                danger
                size="large"
                icon={<LogoutOutlined />}
                onClick={() => setClockOutModalVisible(true)}
                disabled={locationLoading}
                className="min-w-48"
              >
                Clock Out
              </Button>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <CloseCircleOutlined className="text-6xl text-red-500 mb-2" />
                <Title level={3}>You are currently clocked out</Title>
                {workerStatus.lastShiftDuration > 0 && (
                  <Paragraph>
                    Last shift duration: {formatDuration(workerStatus.lastShiftDuration)}
                  </Paragraph>
                )}
              </div>
              
              <Button 
                type="primary"
                size="large"
                icon={<LoginOutlined />}
                onClick={() => setClockInModalVisible(true)}
                disabled={!workerStatus.canClockIn || locationLoading}
                className="min-w-48"
              >
                Clock In
              </Button>
              
              {!workerStatus.canClockIn && workerStatus.canClockInReason && (
                <Alert
                  message={workerStatus.canClockInReason}
                  type="warning"
                  showIcon
                  icon={<WarningOutlined />}
                  className="mt-4"
                />
              )}
            </>
          )}
        </div>
        
        {location && (
          <div className="text-center mt-4">
            <Text type="secondary">
              <EnvironmentOutlined className="mr-1" />
              Your current location: 
              {location.address || `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`}
            </Text>
          </div>
        )}
      </Card>
      
      <Modal
        title="Clock In"
        open={clockInModalVisible}
        onCancel={() => setClockInModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setClockInModalVisible(false)}>
            Cancel
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            loading={clockingIn} 
            onClick={handleClockIn}
          >
            Clock In
          </Button>,
        ]}
      >
        <Form form={clockInForm} layout="vertical">
          <Form.Item name="note" label="Add a note (optional)">
            <TextArea rows={4} placeholder="Enter any details about this clock in..." />
          </Form.Item>
          
          {location && (
            <div className="bg-gray-50 p-3 rounded-md text-sm">
              <p className="font-medium mb-1">Your current location:</p>
              <p className="text-gray-600">
                {location.address || `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`}
              </p>
            </div>
          )}
        </Form>
      </Modal>
      
      <Modal
        title="Clock Out"
        open={clockOutModalVisible}
        onCancel={() => setClockOutModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setClockOutModalVisible(false)}>
            Cancel
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            danger
            loading={clockingOut} 
            onClick={handleClockOut}
          >
            Clock Out
          </Button>,
        ]}
      >
        <Form form={clockOutForm} layout="vertical">
          <Form.Item name="note" label="Add a note (optional)">
            <TextArea rows={4} placeholder="Enter any details about this clock out..." />
          </Form.Item>
          
          {location && (
            <div className="bg-gray-50 p-3 rounded-md text-sm">
              <p className="font-medium mb-1">Your current location:</p>
              <p className="text-gray-600">
                {location.address || `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`}
              </p>
            </div>
          )}
        </Form>
      </Modal>
      
      <Modal
        open={resultVisible}
        footer={null}
        onCancel={() => setResultVisible(false)}
      >
        <Result
          status={resultSuccess ? 'success' : 'error'}
          title={resultSuccess ? 'Operation Successful' : 'Operation Failed'}
          subTitle={resultMessage}
          extra={[
            <Button key="close" onClick={() => setResultVisible(false)}>
              Close
            </Button>,
          ]}
        />
      </Modal>
    </div>
  )
}
