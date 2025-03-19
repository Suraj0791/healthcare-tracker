'use client'

import React, { createContext, useContext, useEffect } from 'react'
import { ApolloClient, InMemoryCache, ApolloProvider, createHttpLink } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { useUser } from '@auth0/nextjs-auth0/client'

const httpLink = createHttpLink({
  uri: '/api/graphql',
})

const authLink = setContext((_, { headers }) => {
  return {
    headers: {
      ...headers,
    }
  }
})

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
})

export const AppContext = createContext<{}>({})

export function useApp() {
  return useContext(AppContext)
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, error, isLoading } = useUser()
  
  return (
    <ApolloProvider client={client}>
      <AppContext.Provider value={{}}>
        {children}
      </AppContext.Provider>
    </ApolloProvider>
  )
}
