import type { University } from '@/types'

export const universities: University[] = [
  { id: 'uni1', name: 'University of Manchester', country: 'UK', defaultCommissionRate: 15, currency: 'GBP' },
  { id: 'uni2', name: 'Arizona State University', country: 'USA', defaultCommissionRate: 12.5, currency: 'USD' },
  { id: 'uni3', name: 'University of Toronto', country: 'Canada', defaultCommissionRate: 17.5, currency: 'CAD' },
  { id: 'uni4', name: 'Monash University', country: 'Australia', defaultCommissionRate: 17.5, currency: 'AUD' },
  { id: 'uni5', name: 'Coventry University', country: 'UK', defaultCommissionRate: 15, currency: 'GBP' },
  { id: 'uni6', name: 'Northeastern University', country: 'USA', defaultCommissionRate: 10, currency: 'USD' },
  { id: 'uni7', name: 'University of Birmingham', country: 'UK', defaultCommissionRate: 15, currency: 'GBP' },
  { id: 'uni8', name: 'McGill University', country: 'Canada', defaultCommissionRate: 12.5, currency: 'CAD' },
  { id: 'uni9', name: 'University of Melbourne', country: 'Australia', defaultCommissionRate: 17.5, currency: 'AUD' },
  { id: 'uni10', name: 'University of Leeds', country: 'UK', defaultCommissionRate: 15, currency: 'GBP' },
]

export const getUniversity = (id: string) => universities.find((u) => u.id === id)
