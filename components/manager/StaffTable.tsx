'use client'

import React, { useState } from 'react'
import { 
  Table, 
  Card, 
  Tag, 
  Space, 
  Button, 
  Modal, 
  Descriptions, 
  Typography, 
  Tabs,
  Input, 
  Spin,
  Badge
} from 'antd'
import { 
  SearchOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  HistoryOutlined
} from '@ant-design/icons'
import { gql, useQuery } from '@apollo/client'
import { format } from 'date-fns'

const { Title, Text } = Typography
const { TabPane } = Tabs

const GET_ALL_STAFF = gql`
  query GetAllStaff($filter: String) {
    allStaff(filter: $filter) {
      id
      name
      email
      isActive
      currentlyClocked
      lastClockIn {
        id
        time
        location {
          latitude
          longitude
          address
        }
        note
      }
      lastClockOut {
        id
        time
        location {
          latitude
          longitude
          address
        }
        note
      }
    }
  }
`

const GET_STAFF_HISTORY = gql`
  query GetStaffHistory($id: ID!) {
    staffHistory(id: $id) {
      id
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

export default function StaffTable() {
  const [searchText, setSearchText] = useState('')
  const [selectedStaff, setSelectedStaff] = useState<any>(null)
  const [detailsVisible, setDetailsVisible] = useState(false)
  const [activeTab, setActiveTab] = useState('1')
  
  const { loading, data, refetch } = useQuery(GET_ALL_STAFF, {
    variables: { filter: searchText },
    fetchPolicy: 'network-only',
  })
  
  const { 
    loading: historyLoading, 
    data: historyData,
    refetch: refetchHistory
  } = useQuery(GET_STAFF_HISTORY, {
    variables: { id: selectedStaff?.id || '' },
    skip: !selectedStaff,
    fetchPolicy: 'network-only',
  })
  
  const showDetails = (record: any) => {
    setSelectedStaff(record)
    refetchHistory({ id: record.id })
    setDetailsVisible(true)
  }
  
  const handleSearch = (value: string) => {
    setSearchText(value)
    refetch({ filter: value })
  }
  
  const formatDateTime = (timestamp: string) => {
    if (!timestamp) return 'N/A'
    return format(new Date(timestamp), 'MMM d, yyyy h:mm a')
  }
  
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }
  
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <div className="flex items-center">
          <UserOutlined className="mr-2" />
          <span>{text}</span>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (text: string, record: any) => (
        <Tag color={record.currentlyClocked ? 'green' : 'default'}>
          {record.currentlyClocked ? 'Clocked In' : 'Clocked Out'}
        </Tag>
      ),
    },
    {
      title: 'Last Clock In',
      dataIndex: 'lastClockIn',
      key: 'lastClockIn',
      render: (clockIn: any) => (
        <span>{clockIn ? formatDateTime(clockIn.time) : 'N/A'}</span>
      ),
    },
    {
      title: 'Last Clock Out',
      dataIndex: 'lastClockOut',
      key: 'lastClockOut',
      render: (clockOut: any) => (
        <span>{clockOut ? formatDateTime(clockOut.time) : 'N/A'}</span>
      ),
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
        <Title level={2}>Staff Management</Title>
        <Input.Search
          placeholder="Search staff..."
          allowClear
          enterButton
          onSearch={handleSearch}
          style={{ width: 300 }}
        />
      </div>
      
      <Card>
        <Table
          columns={columns}
          dataSource={data?.allStaff || []}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
          }}
        />
      </Card>
      
      <Modal
        title={
          <div className="flex items-center gap-2">
            <UserOutlined />
            <span>Staff Details: {selectedStaff?.name}</span>
          </div>
        }
        open={detailsVisible}
        onCancel={() => setDetailsVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailsVisible(false)}>
            Close
          </Button>,
        ]}
        width={800}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane 
            tab={
              <span>
                <ClockCircleOutlined /> Current Status
              </span>
            } 
            key="1"
          >
            {selectedStaff && (
              <Descriptions bordered column={1} className="mt-4">
                <Descriptions.Item label="Status">
                  <Badge 
                    status={selectedStaff.currentlyClocked ? 'success' : 'default'} 
                    text={selectedStaff.currentlyClocked ? 'Currently Clocked In' : 'Not Clocked In'} 
                  />
                </Descriptions.Item>
                
                <Descriptions.Item label="Last Clock In">
                  {selectedStaff.lastClockIn ? (
                    <div>
                      <div><strong>Time:</strong> {formatDateTime(selectedStaff.lastClockIn.time)}</div>
                      <div>
                        <strong>Location:</strong> {selectedStaff.lastClockIn.location.address || 
                          `${selectedStaff.lastClockIn.location.latitude}, ${selectedStaff.lastClockIn.location.longitude}`}
                      </div>
                      {selectedStaff.lastClockIn.note && (
                        <div><strong>Note:</strong> {selectedStaff.lastClockIn.note}</div>
                      )}
                    </div>
                  ) : (
                    'No record'
                  )}
                </Descriptions.Item>
                
                <Descriptions.Item label="Last Clock Out">
                  {selectedStaff.lastClockOut ? (
                    <div>
                      <div><strong>Time:</strong> {formatDateTime(selectedStaff.lastClockOut.time)}</div>
                      <div>
                        <strong>Location:</strong> {selectedStaff.lastClockOut.location.address || 
                          `${selectedStaff.lastClockOut.location.latitude}, ${selectedStaff.lastClockOut.location.longitude}`}
                      </div>
                      {selectedStaff.lastClockOut.note && (
                        <div><strong>Note:</strong> {selectedStaff.lastClockOut.note}</div>
                      )}
                    </div>
                  ) : (
                    'No record'
                  )}
                </Descriptions.Item>
              </Descriptions>
            )}
          </TabPane>
          
          <TabPane
            tab={
              <span>
                <HistoryOutlined /> Shift History
              </span>
            }
            key="2"
          >
            {historyLoading ? (
              <Spin size="large" className="flex justify-center items-center h-64" />
            ) : (
              <div className="mt-4">
                {historyData?.staffHistory?.length > 0 ? (
                  <Table
                    dataSource={historyData.staffHistory}
                    rowKey="id"
                    pagination={{
                      pageSize: 5,
                      showSizeChanger: true,
                      pageSizeOptions: ['5', '10', '20'],
                    }}
                    columns={[
                      {
                        title: 'Clock In',
                        dataIndex: 'clockIn',
                        key: 'clockIn',
                        render: (clockIn: any) => (
                          <div>
                            <div>{formatDateTime(clockIn.time)}</div>
                            <div className="text-xs text-gray-500">
                              {clockIn.location.address || `${clockIn.location.latitude}, ${clockIn.location.longitude}`}
                            </div>
                          </div>
                        ),
                      },
                      {
                        title: 'Clock Out',
                        dataIndex: 'clockOut',
                        key: 'clockOut',
                        render: (clockOut: any) => (
                          clockOut ? (
                            <div>
                              <div>{formatDateTime(clockOut.time)}</div>
                              <div className="text-xs text-gray-500">
                                {clockOut.location.address || `${clockOut.location.latitude}, ${clockOut.location.longitude}`}
                              </div>
                            </div>
                          ) : (
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
                        title: 'Notes',
                        key: 'notes',
                        render: (_, record: any) => (
                          <div>
                            {record.clockIn.note && (
                              <div>
                                <CheckCircleOutlined className="text-green-500 mr-1" />
                                {record.clockIn.note}
                              </div>
                            )}
                            {record.clockOut?.note && (
                              <div>
                                <CloseCircleOutlined className="text-red-500 mr-1" />
                                {record.clockOut.note}
                              </div>
                            )}
                          </div>
                        ),
                      },
                    ]}
                  />
                ) : (
                  <div className="text-center py-10">
                    <Text type="secondary">No shift history available</Text>
                  </div>
                )}
              </div>
            )}
          </TabPane>
        </Tabs>
      </Modal>
    </div>
  )
}
