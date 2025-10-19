import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: 'AIzaSyA9HUuOHVGoMpuY1heqU21UFGBUnKTs-4Q',
  authDomain: 'financeai-pro-5c5c5.firebaseapp.com',
  projectId: 'financeai-pro-5c5c5',
  storageBucket: 'financeai-pro-5c5c5.firebasestorage.app',
  messagingSenderId: '457754000761',
  appId: '1:457754000761:web:a24f2e4c3137a10dde43a8',
  measurementId: 'G-FD0SDJ30GS',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

export default app;
