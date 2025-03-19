import { startServerAndCreateNextHandler } from '@as-integrations/next'
import { ApolloServer } from '@apollo/server'
import { gql } from 'graphql-tag'
import { getSession } from '@auth0/nextjs-auth0'
import { PrismaClient } from '@prisma/client'
import { NextRequest } from 'next/server'
import { validateLocationPerimeter } from '@/lib/geolocation'

const prisma = new PrismaClient()

const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
    role: String!
    isActive: Boolean!
    currentlyClocked: Boolean!
  }
  
  type Location {
    latitude: Float!
    longitude: Float!
    address: String
  }
  
  type ClockEvent {
    id: ID!
    time: String!
    location: Location!
    note: String
  }
  
  type ClockPair {
    id: ID!
    date: String!
    clockIn: ClockEvent!
    clockOut: ClockEvent
    duration: Int!
  }
  
  type WorkerStatus {
    clockedIn: Boolean!
    lastClockIn: ClockEvent
    canClockIn: Boolean!
    canClockInReason: String
    lastShiftDuration: Int!
    totalHoursThisWeek: Int!
  }
  
  type DailyStats {
    date: String!
    hours: Float!
    count: Int!
  }
  
  type StaffHours {
    name: String!
    hours: Float!
  }
  
  type DashboardStats {
    clockedInCount: Int!
    totalStaff: Int!
    avgHoursPerDay: Float!
    hoursByDay: [DailyStats!]!
    staffCountByDay: [DailyStats!]!
    topStaffByHours: [StaffHours!]!
  }
  
  type LocationSettings {
    id: ID!
    perimeter: Float!
    locationName: String!
    latitude: Float!
    longitude: Float!
  }
  
  input LocationSettingsInput {
    perimeter: Float!
    locationName: String!
    latitude: Float!
    longitude: Float!
  }
  
  input ClockInInput {
    latitude: Float!
    longitude: Float!
    note: String
  }
  
  input ClockOutInput {
    latitude: Float!
    longitude: Float!
    note: String
  }
  
  type ClockResponse {
    success: Boolean!
    message: String!
  }
  
  type Query {
    allStaff(filter: String): [User!]!
    staffHistory(id: ID!): [ClockPair!]!
    workerStatus: WorkerStatus!
    workerHistory(startDate: String!, endDate: String!): [ClockPair!]!
    dashboardStats(startDate: String!, endDate: String!): DashboardStats!
    locationSettings: LocationSettings!
  }
  
  type Mutation {
    setUserRole(userId: String!, role: String!): User!
    updateLocationSettings(input: LocationSettingsInput!): LocationSettings!
    clockIn(input: ClockInInput!): ClockResponse!
    clockOut(input: ClockOutInput!): ClockResponse!
  }
`

const resolvers = {
  Query: {
    allStaff: async (_: any, { filter }: { filter?: string }, context: any) => {
      const session = await getSession()
      
      if (!session?.user || session.user.role !== 'MANAGER') {
        throw new Error('Unauthorized')
      }
      
      let whereClause = {}
      
      if (filter) {
        whereClause = {
          OR: [
            { name: { contains: filter, mode: 'insensitive' } },
            { email: { contains: filter, mode: 'insensitive' } }
          ]
        }
      }
      
      const users = await prisma.user.findMany({
        where: {
          ...whereClause,
          role: 'WORKER'
        },
        orderBy: {
          name: 'asc'
        }
      })
      
      return users.map(user => ({
        ...user,
        isActive: true,
        currentlyClocked: user.currentlyClocked || false
      }))
    },
    
    staffHistory: async (_: any, { id }: { id: string }, context: any) => {
      const session = await getSession()
      
      if (!session?.user || session.user.role !== 'MANAGER') {
        throw new Error('Unauthorized')
      }
      
      const clockPairs = await prisma.clockPair.findMany({
        where: {
          userId: id
        },
        include: {
          clockIn: true,
          clockOut: true
        },
        orderBy: {
          date: 'desc'
        }
      })
      
      return clockPairs.map(pair => ({
        ...pair,
        date: pair.date.toISOString(),
        clockIn: {
          ...pair.clockIn,
          time: pair.clockIn.time.toISOString(),
          location: JSON.parse(pair.clockIn.location)
        },
        clockOut: pair.clockOut ? {
          ...pair.clockOut,
          time: pair.clockOut.time.toISOString(),
          location: JSON.parse(pair.clockOut.location)
        } : null
      }))
    },
    
    workerStatus: async (_: any, args: any, context: any) => {
      const session = await getSession()
      
      if (!session?.user) {
        throw new Error('Unauthorized')
      }
      
      const userId = session.user.sub
      
      const user = await prisma.user.findUnique({
        where: { auth0Id: userId }
      })
      
      if (!user) {
        throw new Error('User not found')
      }
      
      let lastClockIn = null
      let lastShiftDuration = 0
      
      // Get the current active clock pair if any
      const activePair = await prisma.clockPair.findFirst({
        where: {
          userId: user.id,
          clockOut: null
        },
        include: {
          clockIn: true
        },
        orderBy: {
          date: 'desc'
        }
      })
      
      // Get the last completed clock pair
      const lastCompletedPair = await prisma.clockPair.findFirst({
        where: {
          userId: user.id,
          clockOut: { not: null }
        },
        orderBy: {
          date: 'desc'
        }
      })
      
      if (lastCompletedPair) {
        lastShiftDuration = lastCompletedPair.duration
      }
      
      // Calculate total hours this week
      const startOfWeek = new Date()
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
      startOfWeek.setHours(0, 0, 0, 0)
      
      const totalMinutesThisWeek = await prisma.clockPair.aggregate({
        where: {
          userId: user.id,
          date: {
            gte: startOfWeek
          }
        },
        _sum: {
          duration: true
        }
      })
      
      // Check if user can clock in
      let canClockIn = true
      let canClockInReason = ''
      
      if (user.currentlyClocked) {
        canClockIn = false
        canClockInReason = 'You are already clocked in'
      } else {
        // Get location settings for perimeter check
        const settings = await prisma.locationSettings.findFirst()
        
        if (settings) {
          // Next API call will include the coordinates to check perimeter
          // This is a placeholder for now
          canClockIn = true 
        }
      }
      
      if (activePair) {
        lastClockIn = {
          ...activePair.clockIn,
          time: activePair.clockIn.time.toISOString(),
          location: JSON.parse(activePair.clockIn.location)
        }
      }
      
      return {
        clockedIn: user.currentlyClocked || false,
        lastClockIn,
        canClockIn,
        canClockInReason,
        lastShiftDuration,
        totalHoursThisWeek: totalMinutesThisWeek._sum.duration || 0
      }
    },
    
    workerHistory: async (_: any, { startDate, endDate }: { startDate: string, endDate: string }, context: any) => {
      const session = await getSession()
      
      if (!session?.user) {
        throw new Error('Unauthorized')
      }
      
      const userId = session.user.sub
      
      const user = await prisma.user.findUnique({
        where: { auth0Id: userId }
      })
      
      if (!user) {
        throw new Error('User not found')
      }
      
      const start = new Date(startDate)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999) // End of day
      
      const clockPairs = await prisma.clockPair.findMany({
        where: {
          userId: user.id,
          date: {
            gte: start,
            lte: end
          }
        },
        include: {
          clockIn: true,
          clockOut: true
        },
        orderBy: {
          date: 'desc'
        }
      })
      
      return clockPairs.map(pair => ({
        ...pair,
        date: pair.date.toISOString(),
        clockIn: {
          ...pair.clockIn,
          time: pair.clockIn.time.toISOString(),
          location: JSON.parse(pair.clockIn.location)
        },
        clockOut: pair.clockOut ? {
          ...pair.clockOut,
          time: pair.clockOut.time.toISOString(),
          location: JSON.parse(pair.clockOut.location)
        } : null
      }))
    },
    
    dashboardStats: async (_: any, { startDate, endDate }: { startDate: string, endDate: string }, context: any) => {
      const session = await getSession()
      
      if (!session?.user || session.user.role !== 'MANAGER') {
        throw new Error('Unauthorized')
      }
      
      const start = new Date(startDate)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999) // End of day
      
      // Get currently clocked in count
      const clockedInCount = await prisma.user.count({
        where: {
          role: 'WORKER',
          currentlyClocked: true
        }
      })
      
      // Get total staff count
      const totalStaff = await prisma.user.count({
        where: {
          role: 'WORKER'
        }
      })
      
      // Get clock pairs within date range
      const clockPairs = await prisma.clockPair.findMany({
        where: {
          date: {
            gte: start,
            lte: end
          },
          clockOut: { not: null }
        },
        include: {
          user: true
        }
      })
      
      // Calculate average hours per day
      const totalMinutes = clockPairs.reduce((acc, pair) => acc + pair.duration, 0)
      const daysDiff = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
      const avgHoursPerDay = (totalMinutes / 60) / daysDiff
      
      // Group by day
      const hoursByDay: { [key: string]: number } = {}
      const staffCountByDay: { [key: string]: number } = {}
      
      clockPairs.forEach(pair => {
        const date = pair.date.toISOString().split('T')[0]
        
        if (!hoursByDay[date]) {
          hoursByDay[date] = 0
          staffCountByDay[date] = 0
        }
        
        hoursByDay[date] += pair.duration / 60 // Convert to hours
        staffCountByDay[date] += 1
      })
      
      // Get top staff by hours
      const staffHours: { [key: string]: number } = {}
      
      clockPairs.forEach(pair => {
        const userName = pair.user.name
        
        if (!staffHours[userName]) {
          staffHours[userName] = 0
        }
        
        staffHours[userName] += pair.duration / 60 // Convert to hours
      })
      
      const topStaffByHours = Object.entries(staffHours)
        .map(([name, hours]) => ({ name, hours }))
        .sort((a, b) => b.hours - a.hours)
        .slice(0, 10)
      
      return {
        clockedInCount,
        totalStaff,
        avgHoursPerDay,
        hoursByDay: Object.entries(hoursByDay)
          .map(([date, hours]) => ({ date, hours }))
          .sort((a, b) => a.date.localeCompare(b.date)),
        staffCountByDay: Object.entries(staffCountByDay)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date)),
        topStaffByHours
      }
    },
    
    locationSettings: async (_: any, args: any, context: any) => {
      const session = await getSession()
      
      if (!session?.user || session.user.role !== 'MANAGER') {
        throw new Error('Unauthorized')
      }
      
      const settings = await prisma.locationSettings.findFirst()
      
      if (!settings) {
        // Create default settings
        const defaultSettings = await prisma.locationSettings.create({
          data: {
            perimeter: 2,
            locationName: 'Main Hospital',
            latitude: 51.505,
            longitude: -0.09
          }
        })
        
        return defaultSettings
      }
      
      return settings
    }
  },
  
  Mutation: {
    setUserRole: async (_: any, { userId, role }: { userId: string, role: string }, context: any) => {
      let user = await prisma.user.findUnique({
        where: { auth0Id: userId }
      })
      
      if (!user) {
        // Create user
        user = await prisma.user.create({
          data: {
            auth0Id: userId,
            name: 'New User',
            email: 'user@example.com',
            role,
            currentlyClocked: false
          }
        })
      } else {
        // Update user role
        user = await prisma.user.update({
          where: { id: user.id },
          data: { role }
        })
      }
      
      return {
        ...user,
        isActive: true
      }
    },
    
    updateLocationSettings: async (_: any, { input }: { input: any }, context: any) => {
      const session = await getSession()
      
      if (!session?.user || session.user.role !== 'MANAGER') {
        throw new Error('Unauthorized')
      }
      
      const { perimeter, locationName, latitude, longitude } = input
      
      // Find existing settings
      const existingSettings = await prisma.locationSettings.findFirst()
      
      if (existingSettings) {
        // Update settings
        const updated = await prisma.locationSettings.update({
          where: { id: existingSettings.id },
          data: {
            perimeter,
            locationName,
            latitude,
            longitude
          }
        })
        
        return updated
      } else {
        // Create settings
        const created = await prisma.locationSettings.create({
          data: {
            perimeter,
            locationName,
            latitude,
            longitude
          }
        })
        
        return created
      }
    },
    
    clockIn: async (_: any, { input }: { input: any }, context: any) => {
      const session = await getSession()
      
      if (!session?.user) {
        throw new Error('Unauthorized')
      }
      
      const userId = session.user.sub
      
      const user = await prisma.user.findUnique({
        where: { auth0Id: userId }
      })
      
      if (!user) {
        throw new Error('User not found')
      }
      
      if (user.currentlyClocked) {
        throw new Error('You are already clocked in')
      }
      
      const { latitude, longitude, note } = input
      
      // Check if user is within the perimeter
      const settings = await prisma.locationSettings.findFirst()
      
      if (!settings) {
        throw new Error('Location settings not found')
      }
      
      const withinPerimeter = validateLocationPerimeter(
        latitude,
        longitude,
        settings.latitude,
        settings.longitude,
        settings.perimeter
      )
      
      if (!withinPerimeter) {
        return {
          success: false,
          message: `You are outside the allowed perimeter (${settings.perimeter}km from ${settings.locationName})`
        }
      }
      
      // Create a clock in event
      const clockIn = await prisma.clockEvent.create({
        data: {
          time: new Date(),
          location: JSON.stringify({
            latitude,
            longitude
          }),
          note: note || null
        }
      })
      
      // Create a clock pair
      await prisma.clockPair.create({
        data: {
          userId: user.id,
          date: new Date(),
          clockInId: clockIn.id,
          duration: 0
        }
      })
      
      // Update user status
      await prisma.user.update({
        where: { id: user.id },
        data: { currentlyClocked: true }
      })
      
      return {
        success: true,
        message: 'Successfully clocked in'
      }
    },
    
    clockOut: async (_: any, { input }: { input: any }, context: any) => {
      const session = await getSession()
      
      if (!session?.user) {
        throw new Error('Unauthorized')
      }
      
      const userId = session.user.sub
      
      const user = await prisma.user.findUnique({
        where: { auth0Id: userId }
      })
      
      if (!user) {
        throw new Error('User not found')
      }
      
      if (!user.currentlyClocked) {
        throw new Error('You are not clocked in')
      }
      
      const { latitude, longitude, note } = input
      
      // Find the active clock pair
      const activePair = await prisma.clockPair.findFirst({
        where: {
          userId: user.id,
          clockOut: null
        },
        include: {
          clockIn: true
        },
        orderBy: {
          date: 'desc'
        }
      })
      
      if (!activePair) {
        throw new Error('No active clock in found')
      }
      
      // Create a clock out event
      const clockOut = await prisma.clockEvent.create({
        data: {
          time: new Date(),
          location: JSON.stringify({
            latitude,
            longitude
          }),
          note: note || null
        }
      })
      
      // Calculate duration in minutes
      const clockInTime = activePair.clockIn.time
      const clockOutTime = new Date()
      const durationMs = clockOutTime.getTime() - clockInTime.getTime()
      const durationMinutes = Math.round(durationMs / (1000 * 60))
      
      // Update the clock pair
      await prisma.clockPair.update({
        where: { id: activePair.id },
        data: {
          clockOutId: clockOut.id,
          duration: durationMinutes
        }
      })
      
      // Update user status
      await prisma.user.update({
        where: { id: user.id },
        data: { currentlyClocked: false }
      })
      
      return {
        success: true,
        message: 'Successfully clocked out'
      }
    }
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

const handler = startServerAndCreateNextHandler<NextRequest>(server, {
  context: async (req, res) => {
    return { req, res }
  },
})

export { handler as GET, handler as POST }
