import { blink } from '@/blink/client'

export type CareFlowUser = {
  id: string
  email: string
  displayName?: string | null
}

export function subscribeToAuth(callback: (user: CareFlowUser | null, loading: boolean) => void) {
  return blink.auth.onAuthStateChanged(state => {
    callback(state.user ? { id: state.user.id, email: state.user.email, displayName: state.user.displayName } : null, state.isLoading)
  })
}

export async function signOut() {
  await blink.auth.logout()
}
