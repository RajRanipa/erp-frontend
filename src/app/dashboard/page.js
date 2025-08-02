'use client'
export const dynamic = 'force-dynamic';
import React from 'react'

const Dashboard = () => {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>🔐 Welcome to the ERP Dashboard</h1>
      <p>This page is protected by middleware and only accessible to authenticated users.</p>
    </div>
  )
}

export default Dashboard