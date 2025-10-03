import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

const Layout = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto pt-16 pb-20 lg:pt-0 lg:pb-0">
          <div className="container mx-auto px-3 py-4 lg:px-6 lg:py-6 max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout