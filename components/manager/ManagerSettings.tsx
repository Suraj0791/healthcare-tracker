'use client'

import React, { useState, useEffect } from 'react'
import { Card, Form, InputNumber, Button, message, Divider, Typography, Alert, Spin } from 'antd'
import { gql, useQuery, useMutation } from '@apollo/client'
import { EnvironmentOutlined } from '@ant-design/icons'
import { MapContainer, TileLayer, Circle, Marker, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-defaulticon-compatibility'
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css'

const { Title, Text } = Typography

const GET_SETTINGS = gql`
  query GetLocationSettings {
    locationSettings {
      id
      perimeter
      locationName
      latitude
      longitude
    }
  }
`

const UPDATE_SETTINGS = gql`
  mutation UpdateLocationSettings($input: LocationSettingsInput!) {
    updateLocationSettings(input: $input) {
      id
      perimeter
      locationName
      latitude
      longitude
    }
  }
`

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap()
  
  useEffect(() => {
    map.setView(center, 13)
  }, [center, map])
  
  return null
}

export default function ManagerSettings() {
  const [form] = Form.useForm()
  const [mapCenter, setMapCenter] = useState<[number, number]>([51.505, -0.09]) // Default
  const [mapKey, setMapKey] = useState(Date.now()) // Key for forcing re-render
  
  const { loading, error, data } = useQuery(GET_SETTINGS)
  
  const [updateSettings, { loading: updating }] = useMutation(UPDATE_SETTINGS, {
    onCompleted: () => {
      message.success('Location settings updated successfully')
    },
    onError: (error) => {
      message.error(`Failed to update settings: ${error.message}`)
    }
  })
  
  useEffect(() => {
    if (data?.locationSettings) {
      const { perimeter, locationName, latitude, longitude } = data.locationSettings
      form.setFieldsValue({
        perimeter,
        locationName,
        latitude,
        longitude
      })
      
      setMapCenter([latitude, longitude])
      setMapKey(Date.now()) // Force map re-render
    }
  }, [data, form])
  
  const onFinish = (values: any) => {
    updateSettings({
      variables: {
        input: {
          perimeter: values.perimeter,
          locationName: values.locationName,
          latitude: values.latitude,
          longitude: values.longitude
        }
      }
    })
  }
  
  if (loading && !data) {
    return <Spin size="large" className="flex justify-center items-center h-64" />
  }
  
  return (
    <div>
      <Title level={2}>Location Settings</Title>
      <Text type="secondary" className="mb-6 block">
        Configure the location perimeter for staff clock in/out
      </Text>
      
      <Card>
        {error && (
          <Alert
            message="Error loading settings"
            description={error.message}
            type="error"
            showIcon
            className="mb-4"
          />
        )}
        
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            perimeter: 2,
            locationName: 'Main Hospital',
            latitude: 51.505,
            longitude: -0.09
          }}
        >
          <Form.Item
            name="locationName"
            label="Location Name"
            rules={[{ required: true, message: 'Please enter location name' }]}
          >
            <input 
              type="text" 
              className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </Form.Item>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="latitude"
              label="Latitude"
              rules={[{ required: true, message: 'Please enter latitude' }]}
            >
              <InputNumber 
                className="w-full" 
                precision={6} 
                step={0.000001} 
                onChange={() => {
                  const lat = form.getFieldValue('latitude')
                  const lng = form.getFieldValue('longitude')
                  if (lat && lng) {
                    setMapCenter([lat, lng])
                    setMapKey(Date.now()) // Force map re-render
                  }
                }}
              />
            </Form.Item>
            
            <Form.Item
              name="longitude"
              label="Longitude"
              rules={[{ required: true, message: 'Please enter longitude' }]}
            >
              <InputNumber 
                className="w-full" 
                precision={6} 
                step={0.000001}
                onChange={() => {
                  const lat = form.getFieldValue('latitude')
                  const lng = form.getFieldValue('longitude')
                  if (lat && lng) {
                    setMapCenter([lat, lng])
                    setMapKey(Date.now()) // Force map re-render
                  }
                }}
              />
            </Form.Item>
          </div>
          
          <Form.Item
            name="perimeter"
            label="Perimeter Radius (km)"
            rules={[{ required: true, message: 'Please enter perimeter radius' }]}
          >
            <InputNumber 
              className="w-full" 
              min={0.1} 
              max={10} 
              step={0.1} 
              precision={1} 
            />
          </Form.Item>
          
          <Divider />
          
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <EnvironmentOutlined className="mr-1" />
              <Text strong>Location Preview</Text>
            </div>
            
            <div className="h-96 w-full border rounded-md overflow-hidden">
              <MapContainer 
                key={mapKey}
                center={mapCenter} 
                zoom={13} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={mapCenter}></Marker>
                <Circle 
                  center={mapCenter} 
                  radius={form.getFieldValue('perimeter') * 1000} 
                  pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.2 }}
                />
                <MapUpdater center={mapCenter} />
              </MapContainer>
            </div>
            <Text type="secondary" className="mt-2 block">
              The blue circle shows the perimeter within which staff can clock in/out
            </Text>
          </div>
          
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={updating}
            className="mt-4"
          >
            Save Settings
          </Button>
        </Form>
      </Card>
    </div>
  )
}
