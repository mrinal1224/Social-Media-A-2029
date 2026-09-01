import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'

function PublicRoute({ children }) {

  const [user, loading] = useAuth()


  if (loading) {
    return <h1>Loading..</h1>
  }

  if (user) {
    Navigate('/home')
  }


  return children
}

export default PublicRoute