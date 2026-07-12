import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { routes } from '@/router/routes'

const router = createBrowserRouter(routes)

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors closeButton />
    </>
  )
}
