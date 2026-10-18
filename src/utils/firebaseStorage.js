import { initializeApp, getApps } from 'firebase/app';
import { getStorage, ref, uploadString, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCi_UaUdDwiJxl92gAPuknb-mMhOnyZkyU",
  authDomain: "spot-undoo-app.firebaseapp.com",
  projectId: "spot-undoo-app",
  storageBucket: "spot-undoo-app.firebasestorage.app",
  messagingSenderId: "745674728664",
  appId: "1:745674728664:android:77b5cb70093d3a04d5e3ad"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const storage = getStorage(app);

/**
 * Upload an image (dataURL string or File/Blob) to Firebase Storage
 * @param {string|File|Blob} fileOrDataUrl
 * @param {string} folder
 * @returns {Promise<string>} public download URL
 */
export async function uploadImageToFirebase(fileOrDataUrl, folder = 'spots') {
  if (!fileOrDataUrl) return '';
  try {
    const filename = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`;
    const storageRef = ref(storage, filename);

    if (typeof fileOrDataUrl === 'string' && fileOrDataUrl.startsWith('data:')) {
      await uploadString(storageRef, fileOrDataUrl, 'data_url');
    } else if (fileOrDataUrl instanceof Blob || fileOrDataUrl instanceof File) {
      await uploadBytes(storageRef, fileOrDataUrl);
    } else {
      return fileOrDataUrl;
    }

    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (err) {
    console.warn('Firebase Storage upload warning, using local/data fallback:', err);
    return typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '';
  }
}
