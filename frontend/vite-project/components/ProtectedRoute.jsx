import React from 'react'
import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'



function ProtectedRoute({children}) {
   const [user , loading] = useAuth()

   if(loading){
    return <h1>Loading...</h1>
   }

   if(!user){
     Navigate('/login')
   }


  return children
}

export default ProtectedRoute