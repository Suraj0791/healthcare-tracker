'use client'

import React, { useState } from 'react'
import { 
  Card, 
  Table, 
  DatePicker, 
  Typography, 
  Spin, 
  Alert, 
  Tag, 
  Space, 
  Button, 
  Drawer, 
  Descriptions
} from 'antd'
import { 
  HistoryOutlined, 
  CalendarOutlined, 
  ClockCircleOutlined, 
  EnvironmentOutlined, 
  FileTextOutlined
} from '@ant-design/icons'
import { format } from 'date-fns'
import { gql, useQuery } from '@apollo/client'
import { useFetcher } from '@/hooks/useFetcher'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

const GET_WORKER_HISTORY = gql`
  query GetWorkerHistory($startDate: String!, $endDate: String!) {
    workerHistory(startDate: $startDate, endDate: $endDate) {
      id
      date
      clockIn {
        id
        time
        location {
          latitude
          longitude
          address
        }
        note
      }
      clockOut {
        id
        time
        location {
          latitude
          longitude
          address
        }
        note
      }
      duration
    }
  }
`

export default function WorkerHistory() {
  const [dateRange, setDateRange] = useState<[Date, Date]>([
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    new Date()
  ])
  
  const [detailsVisible, setDetailsVisible] = useState(false)
  const [selectedShift, setSelectedShift] = useState<any>(null)
  
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]
  }
  
  const { loading, error, data, refetch } = useQuery(GET_WORKER_HISTORY, {
    variables: {
      startDate: formatDate(dateRange[0]),
      endDate: formatDate(dateRange[1])
    },
    fetchPolicy: 'network-only'
  })
  
  const { fetcher } = useFetcher()
  
  const formatDateTime = (timestamp: string) => {
    if (!timestamp) return 'N/A'
    return format(new Date(timestamp), 'MMM d, yyyy h:mm a')
  }
  
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }
  
  const handleDateChange = (dates: any) => {
    if (dates && dates.length === 2) {
      setDateRange([dates[0].toDate(), dates[1].toDate()])
      refetch({
        startDate: formatDate(dates[0].toDate()),
        endDate: formatDate(dates[1].toDate())
      })
    }
  }
  
  const showDetails = (record: any) => {
    setSelectedShift(record)
    setDetailsVisible(true)
  }
  
  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (text: string) => format(new Date(text), 'MMM d, yyyy'),
    },
    {
      title: 'Clock In',
      dataIndex: 'clockIn',
      key: 'clockIn',
      render: (clockIn: any) => (
        clockIn ? formatDateTime(clockIn.time) : 'N/A'
      ),
    },
    {
      title: 'Clock Out',
      dataIndex: 'clockOut',
      key: 'clockOut',
      render: (clockOut: any, record: any) => (
        clockOut ? formatDateTime(clockOut.time) : (
          <Tag color="orange">Still Clocked In</Tag>
        )
      ),
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number) => formatDuration(duration),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text: string, record: any) => (
        <Space size="middle">
          <Button type="link" onClick={() => showDetails(record)}>
            View Details
          </Button>
        </Space>
      ),
    },
  ]
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Title level={2} className="flex items-center">
          <HistoryOutlined className="mr-2" /> Shift History
        </Title>
        <RangePicker 
          onChange={handleDateChange}
          defaultValue={[
            fetcher.dayjs(dateRange[0]),
            fetcher.dayjs(dateRange[1])
          ]}
        />
      </div>
      
      <Card>
        {error && (
          <Alert
            message="Error loading shift history"
            description={error.message}
            type="error"
            showIcon
            className="mb-4"
          />
        )}
        
        {loading && !data ? (
          <Spin size="large" className="flex justify-center items-center h-64" />
        ) : (
          <Table
            columns={columns}
            dataSource={data?.workerHistory || []}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
            }}
          />
        )}
      </Card>
      
      <Drawer
        title={
          <div className="flex items-center">
            <CalendarOutlined className="mr-2" />
            <span>Shift Details</span>
          </div>
        }
        placement="right"
        onClose={() => setDetailsVisible(false)}
        open={detailsVisible}
        width={500}
      >
        {selectedShift && (
          <div>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Date">
                {format(new Date(selectedShift.date), 'MMMM d, yyyy')}
              </Descriptions.Item>
              
              <Descriptions.Item 
                label={
                  <div className="flex items-center">
                    <ClockCircleOutlined className="mr-1" /> Clock In
                  </div>
                }
              >
                {selectedShift.clockIn ? (
                  <div>
                    <div>{formatDateTime(selectedShift.clockIn.time)}</div>
                    <div className="flex items-center text-gray-500 mt-1">
                      <EnvironmentOutlined className="mr-1" />
                      {selectedShift.clockIn.location.address || 
                        `${selectedShift.clockIn.location.latitude.toFixed(6)}, ${selectedShift.clockIn.location.longitude.toFixed(6)}`}
                    </div>
                  </div>
                ) : 'N/A'}
              </Descriptions.Item>
              
              <Descriptions.Item 
                label={
                  <div className="flex items-center">
                    <ClockCircleOutlined className="mr-1" /> Clock Out
                  </div>
                }
              >
                {selectedShift.clockOut ? (
                  <div>
                    <div>{formatDateTime(selectedShift.clockOut.time)}</div>
                    <div className="flex items-center text-gray-500 mt-1">
                      <EnvironmentOutlined className="mr-1" />
                      {selectedShift.clockOut.location.address || 
                        `${selectedShift.clockOut.location.latitude.toFixed(6)}, ${selectedShift.clockOut.location.longitude.toFixed(6)}`}
                    </div>
                  </div>
                ) : (
                  <Tag color="orange">Still Clocked In</Tag>
                )}
              </Descriptions.Item>
              
              <Descriptions.Item label="Duration">
                {formatDuration(selectedShift.duration)}
              </Descriptions.Item>
            </Descriptions>
            
            <div className="mt-6">
              <Title level={5} className="flex items-center mb-3">
                <FileTextOutlined className="mr-1" /> Notes
              </Title>
              
              {(selectedShift.clockIn?.note || selectedShift.clockOut?.note) ? (
                <div>
                  {selectedShift.clockIn?.note && (
                    <div className="mb-3">
                      <Text strong>Clock In Note:</Text>
                      <div className="bg-gray-50 p-3 rounded-md mt-1">
                        {selectedShift.clockIn.note}
                      </div>
                    </div>
                  )}
                  
                  {selectedShift.clockOut?.note && (
                    <div>
                      <Text strong>Clock Out Note:</Text>
                      <div className="bg-gray-50 p-3 rounded-md mt-1">
                        {selectedShift.clockOut.note}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Text type="secondary">No notes for this shift</Text>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
