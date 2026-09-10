import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axiosInstance from '../axiosCalls/axios'

function Profile() {
    const { username } = useParams()
    const [userData, setUserData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isFollowing, setIsFollowing] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)

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

    useEffect(() => {
        const checkFollowing = async () => {
            if (!userData) return

            try {
                const meResponse = await axiosInstance.get('/users/me')
                const myFollowingList = meResponse.data.followings || []

                setIsFollowing(
                    myFollowingList.some(
                        (id) => id.toString() === userData._id.toString()
                    )
                )
            } catch (error) {
                console.error("Failed to check follow status:", error)
            }
        }

        checkFollowing()
    }, [userData])

    const handleFollowToggle = async () => {
        try {
            setActionLoading(true)

            if (isFollowing) {
                await axiosInstance.delete(`/users/${userData._id}/follow`)

                setUserData((prev) => ({
                    ...prev,
                    followers: prev.followers.filter(
                        (user) => user._id !== undefined ? user._id !== prev._id : true
                    )
                }))
            } else {
                await axiosInstance.post(`/users/${userData._id}/follow`)
            }

            setIsFollowing(!isFollowing)

            const refreshedProfile = await axiosInstance.get(`/users/profile/${username}`)
            setUserData(refreshedProfile.data.userData)
        } catch (error) {
            console.error("Follow action failed:", error)
            alert(error.response?.data?.message || "Something went wrong")
        } finally {
            setActionLoading(false)
        }
    }

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
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-gray-100">
                <img
                    src={userData.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || 'User')}&background=6366f1&color=fff`}
                    alt={userData.name || 'Profile'}
                    className="w-28 h-28 rounded-full object-cover border-4 border-indigo-50 shadow-sm"
                />

                <div className="text-center sm:text-left space-y-1">
                    <h1 className="text-2xl font-bold text-gray-900">{userData.name}</h1>
                    <p className="text-sm font-medium text-indigo-600">@{userData.username}</p>
                    <p className="text-sm text-gray-500">{userData.email}</p>

                    <button
                        onClick={handleFollowToggle}
                        disabled={actionLoading}
                        className="mt-3 px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-50"
                    >
                        {actionLoading ? 'Please wait...' : isFollowing ? 'Unfollow' : 'Follow'}
                    </button>
                </div>
            </div>

            <div className="py-4">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">About</h2>
                <p className="text-gray-700 text-sm leading-relaxed">
                    {userData.bio || "No bio available yet."}
                </p>
            </div>

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

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Followers</h3>
                    {userData.followers?.length === 0 ? (
                        <p className="text-sm text-gray-500">No followers yet.</p>
                    ) : (
                        userData.followers?.map((user) => (
                            <div key={user._id} className="py-2 border-b last:border-b-0">
                                <p className="font-medium text-sm">{user.name}</p>
                                <p className="text-xs text-gray-500">@{user.username}</p>
                            </div>
                        ))
                    )}
                </div>

                <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Following</h3>
                    {userData.followings?.length === 0 ? (
                        <p className="text-sm text-gray-500">Not following anyone yet.</p>
                    ) : (
                        userData.followings?.map((user) => (
                            <div key={user._id} className="py-2 border-b last:border-b-0">
                                <p className="font-medium text-sm">{user.name}</p>
                                <p className="text-xs text-gray-500">@{user.username}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}

export default Profile
