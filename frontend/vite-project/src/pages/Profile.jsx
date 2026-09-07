import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axiosInstance from '../axiosCalls/axios'


function Profile() {
    const { username } = useParams()
    const [userData, setUserData] = useState(null)
    // get the user profile Data with userName



    useEffect(() => {
        const fetchProfile = async () => {
            const user = await axiosInstance.get(`/users/profile/${username}`)
            console.log(user.data.userData) // Bad Practice
            setUserData(user.data.userData)
        }

        fetchProfile()
    }, [username])



    return (

        
        <div>
            <p>{userData && userData.name}</p>
            <p>{userData && userData.username}</p>
            <p>{userData && userData.email}</p>
            <p>{userData && userData.followers.length}</p>
            <p>{userData && userData.followings.length}</p>
         
        </div>
    )
}

export default Profile