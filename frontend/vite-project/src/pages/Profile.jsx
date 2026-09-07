import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axiosInstance from '../axiosCalls/axios'

function Profile() {
    const { username } = useParams()
    const [userData, setUserData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true)
                const user = await axiosInstance.get(`/users/profile/${username}`)
                setUserData(user.data.userData)
            } catch (error) {
                console.error("Failed to fetch profile data:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchProfile()
    }, [username])

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    if (!userData) {
        return (
            <div className="text-center py-10 text-gray-500">
                User profile not found.
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto my-8 p-6 bg-white rounded-xl shadow-md border border-gray-100">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-gray-100">
                {/* Profile Image */}
                <img
                    src={userData.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || 'User')}&background=6366f1&color=fff`}
                    alt={userData.name || 'Profile'}
                    className="w-28 h-28 rounded-full object-cover border-4 border-indigo-50 shadow-sm"
                />

                {/* Identity Info */}
                <div className="text-center sm:text-left space-y-1">
                    <h1 className="text-2xl font-bold text-gray-900">{userData.name}</h1>
                    <p className="text-sm font-medium text-indigo-600">@{userData.username}</p>
                    <p className="text-sm text-gray-500">{userData.email}</p>
                </div>
            </div>

            {/* Bio Section */}
            <div className="py-4">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">About</h2>
                <p className="text-gray-700 text-sm leading-relaxed">
                    {userData.bio || "No bio available yet."}
                </p>
            </div>

            {/* Stats Bar (Posts, Followers, Following) */}
            <div className="flex justify-around items-center pt-4 border-t border-gray-100 text-center">
                <div className="flex-1">
                    <span className="block text-xl font-bold text-gray-900">
                        {userData.posts?.length ?? userData.postsCount ?? 0}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">Posts</span>
                </div>
                <div className="h-8 w-px bg-gray-200"></div>
                <div className="flex-1">
                    <span className="block text-xl font-bold text-gray-900">
                        {userData.followers?.length || 0}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">Followers</span>
                </div>
                <div className="h-8 w-px bg-gray-200"></div>
                <div className="flex-1">
                    <span className="block text-xl font-bold text-gray-900">
                        {userData.followings?.length || 0}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">Following</span>
                </div>
            </div>
        </div>
    )
}

export default Profile