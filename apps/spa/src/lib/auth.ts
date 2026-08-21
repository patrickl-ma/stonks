import { createAuthClient } from 'better-auth/react'

const apiURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export const authClient = createAuthClient({
  baseURL: apiURL,
  fetchOptions: {
    credentials: 'include',
  },
})
