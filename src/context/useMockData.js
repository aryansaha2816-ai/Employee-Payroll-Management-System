import { useContext } from 'react'
import { MockDataContext } from './mockDataContextDefinition'

export const useMockData = () => {
  const context = useContext(MockDataContext)
  if (!context) throw new Error('useMockData must be used within MockDataProvider')
  return context
}