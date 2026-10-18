import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously as firebaseSignInAnonymously,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { getBackendUrl } from './apiConfig';

const firebaseConfig = {
  apiKey: "AIzaSyCi_UaUdDwiJxl92gAPuknb-mMhOnyZkyU",
  authDomain: "spot-undoo-app.firebaseapp.com",
  projectId: "spot-undoo-app",
  storageBucket: "spot-undoo-app.firebasestorage.app",
  messagingSenderId: "745674728664",
  appId: "1:745674728664:android:77b5cb70093d3a04d5e3ad"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Sync Firebase user with backend to get JWT and store in localStorage
 */
async function syncWithBackend(fbUser, isAnonymous = false) {
  const backendUrl = getBackendUrl();
  const payload = {
    uid: fbUser.uid,
    email: fbUser.email || `anon_${fbUser.uid.slice(0, 8)}@spotundoo.test`,
    name: fbUser.displayName || (isAnonymous ? 'Anonymous Tester' : 'Explorer'),
    avatar: fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(fbUser.uid)}`,
    isAnonymous: !!isAnonymous,
  };

  try {
    const res = await fetch(`${backendUrl}/api/auth/firebase-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('jwt', data.token);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      return data.user;
    }
  } catch (err) {
    console.warn('Backend sync warning, using local fallback:', err);
  }

  // Fallback for offline or direct client execution
  const fallbackUser = {
    id: fbUser.uid,
    name: payload.name,
    email: payload.email,
    avatar: payload.avatar,
    isAnonymous: !!isAnonymous,
  };
  localStorage.setItem('jwt', `fb_token_${fbUser.uid}`);
  localStorage.setItem('currentUser', JSON.stringify(fallbackUser));
  return fallbackUser;
}

/**
 * Sign in with Google (Firebase)
 */
export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return await syncWithBackend(result.user, false);
}

/**
 * Sign in Anonymously (for test mode / instant access)
 */
export async function signInAnonymously() {
  const result = await firebaseSignInAnonymously(auth);
  return await syncWithBackend(result.user, true);
}

/**
 * Sign out
 */
export async function logoutUser() {
  try {
    await firebaseSignOut(auth);
  } catch {}
  localStorage.removeItem('jwt');
  localStorage.removeItem('currentUser');
}
