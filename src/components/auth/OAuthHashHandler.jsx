import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

/**
 * Surfaces Supabase OAuth errors from the URL hash/query and cleans the address bar.
 */
function OAuthHashHandler() {
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const hash = window.location.hash.startsWith('#')
      ? window.location.hash.slice(1)
      : window.location.hash
    const hashParams = new URLSearchParams(hash)

    const error =
      params.get('error') ||
      params.get('error_code') ||
      hashParams.get('error') ||
      hashParams.get('error_code')
    const description =
      params.get('error_description') || hashParams.get('error_description') || ''

    if (!error) return

    const nice = decodeURIComponent(description.replace(/\+/g, ' '))
    if (String(error).includes('bad_oauth_state') || nice.toLowerCase().includes('state')) {
      toast.error(
        'Google sign-in expired or started on a different site. Open /auth on this same URL and try again.',
      )
    } else {
      toast.error(nice || 'Google sign-in failed')
    }

    window.history.replaceState({}, document.title, window.location.pathname)
    navigate('/', { replace: true })
  }, [navigate])

  return null
}

export default OAuthHashHandler
