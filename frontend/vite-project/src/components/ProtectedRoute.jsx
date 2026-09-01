import React from 'react'

import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'



function ProtectedRoute({children}) {
   const {user , loading} = useAuth()

   if(loading){
    return <h1>Loading...</h1>
   }

   if(!user){
     return Navigate('/login')
   }


  return children
}

export default ProtectedRoute