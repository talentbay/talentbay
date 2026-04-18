/**
 * Authentication Store
 * Pinia store for managing authentication state and actions
 *
 * Tokens are stored in cookies via useCookie for SSR compatibility
 */

import { defineStore } from 'pinia'
import type { User, LoginRequest, LoginResponse } from '~/shared/types/auth.types'

export const useAuthStore = defineStore('auth', () => {
    // State
    const user = ref<User | null>(null)

    // Cookies for token storage (SSR-compatible)
    const accessToken = useCookie<string | null>('access_token', {
        maxAge: 15 * 60, // 15 minutes
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
    })

    const refreshToken = useCookie<string | null>('refresh_token', {
        maxAge: 30 * 24 * 60 * 60, // 30 days
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
    })

    // Getters
    const isAuthenticated = computed(() => !!user.value && !!accessToken.value)

    const userRoles = computed(() => {
        return user.value?.roles?.map(r => r.value) || []
    })

    const hasRole = (role: string | string[]): boolean => {
        const roles = Array.isArray(role) ? role : [role]
        return roles.some(r => userRoles.value.includes(r))
    }

    // Actions

    const setUser = (data: User) => {
        user.value = data
    }

    const setTokens = (access_token: string | null, refresh_token: string | null) => {
        accessToken.value = access_token
        refreshToken.value = refresh_token
    }

    const login = async (credentials: LoginRequest) => {
        const api = useApi()

        try {
            // Backend returns tokens in response body
            // @ts-ignore
            const response = await api.login<LoginResponse>(credentials)

            // Store tokens in cookies
            accessToken.value = response.data.tokens.access_token
            refreshToken.value = response.data.tokens.refresh_token

            // Fetch user data
            await fetchUser()

            return response
        }
        catch (error) {
            console.error('Login failed:', error)
            throw error
        }
    }

    const logout = async () => {
        const api = useApi()

        try {
            // Call backend logout
            await api.logout()
        }
        catch (error) {
            console.error('Logout API call failed:', error)
        }
        finally {
            // Clear tokens and user state
            accessToken.value = null
            refreshToken.value = null
            user.value = null

            // Redirect to login
            await navigateTo('/')
        }
    }

    const refreshTokens = async () => {
        const api = useApi()

        if (!refreshToken.value) {
            throw new Error('No refresh token available')
        }

        try {
            // @ts-ignore
            const response = await api.refresh<LoginResponse>({ token: refreshToken.value })

            // Update tokens
            accessToken.value = response.data.tokens.access_token
            refreshToken.value = response.data.tokens.refresh_token

            return response
        }
        catch (error) {
            console.error('Token refresh failed:', error)
            // Clear tokens on refresh failure
            accessToken.value = null
            refreshToken.value = null
            throw error
        }
    }

    const fetchUser = async () => {
        const api = useApi()

        try {
            // @ts-ignore
            const userData = await api.fetchMe<{ data: User }>()
            user.value = userData.data
            return userData
        }
        catch (error) {
            // Don't log error here - it may be expected (e.g., expired token)
            // Let the caller handle the error
            user.value = null
            throw error
        }
    }

    const checkAuth = async (): Promise<boolean> => {
        // If user already loaded and have token, we're authenticated
        if (user.value && accessToken.value) {
            return true
        }

        // If no tokens at all, not authenticated
        if (!accessToken.value && !refreshToken.value) {
            return false
        }

        // If we have refresh_token but no access_token, try to refresh first
        if (!accessToken.value && refreshToken.value) {
            try {
                await refreshTokens()
            }
            catch (error) {
                // Refresh failed, clear everything
                accessToken.value = null
                refreshToken.value = null
                user.value = null
                return false
            }
        }

        // Now try to fetch user data
        // At this point we should have a valid access_token (fresh or refreshed)
        try {
            await fetchUser()
            return true
        }
        catch (error: any) {
            // If still getting 401, something is wrong - clear tokens
            if (error.statusCode === 401) {
                accessToken.value = null
                refreshToken.value = null
                user.value = null
            }
            return false
        }
    }

    return {
        // State
        user,
        accessToken,
        refreshToken,

        // Getters
        isAuthenticated,
        userRoles,
        hasRole,

        // Actions
        login,
        logout,
        refreshTokens,
        fetchUser,
        checkAuth,
        setUser,
        setTokens,
    }
})