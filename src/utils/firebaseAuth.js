import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInWithCredential,
  GoogleAuthProvider,
  signInAnonymously as firebaseSignInAnonymously,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
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

// Initialize native GoogleAuth on Android/iOS
try {
  GoogleAuth.initialize({
    clientId: '745674728664-c9mj0c8bglu1dhuq5bmvt3m404io9n5n.apps.googleusercontent.com',
    scopes: ['profile', 'email'],
    grantOfflineAccess: true,
  });
} catch {}

/**
 * Sync Firebase user with backend to get JWT and store in localStorage
 */
async function syncWithBackend(fbUser, isAnonymous = false) {
  const backendUrl = getBackendUrl();
  const uid = fbUser.uid || fbUser.id;
  const payload = {
    uid,
    email: fbUser.email || `anon_${String(uid || '').slice(0, 8)}@spotundoo.test`,
    name: fbUser.displayName || fbUser.name || (isAnonymous ? 'Anonymous Tester' : 'Explorer'),
    avatar: fbUser.photoURL || fbUser.imageUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(uid || 'user')}`,
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
    id: payload.uid,
    name: payload.name,
    email: payload.email,
    avatar: payload.avatar,
    isAnonymous: !!isAnonymous,
  };
  localStorage.setItem('jwt', `fb_token_${payload.uid}`);
  localStorage.setItem('currentUser', JSON.stringify(fallbackUser));
  return fallbackUser;
}

/**
 * Sign in with Google (Native bottom-sheet on Android, Popup on Web)
 */
export async function signInWithGoogle() {
  if (Capacitor.isNativePlatform()) {
    try {
      const googleUser = await GoogleAuth.signIn();
      if (googleUser?.authentication?.idToken) {
        try {
          const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
          const fbRes = await signInWithCredential(auth, credential);
          return await syncWithBackend(fbRes.user, false);
        } catch (e) {
          console.warn('Firebase credential sync warning:', e);
        }
      }
      return await syncWithBackend({
        uid: googleUser.id,
        email: googleUser.email,
        displayName: googleUser.name || `${googleUser.givenName || ''} ${googleUser.familyName || ''}`.trim(),
        photoURL: googleUser.imageUrl,
      }, false);
    } catch (nativeErr) {
      console.warn('Native Google sign in error:', nativeErr);
      throw nativeErr;
    }
  }

  // Web Browser fallback
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
    if (Capacitor.isNativePlatform()) {
      await GoogleAuth.signOut();
    }
  } catch {}
  try {
    await firebaseSignOut(auth);
  } catch {}
  localStorage.removeItem('jwt');
  localStorage.removeItem('currentUser');
}
