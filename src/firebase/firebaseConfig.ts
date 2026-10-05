import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDMXjCnVLSkh_dFChW4mWSazk60yWfCbrE",
  authDomain: "projects-a1050.firebaseapp.com",
  projectId: "projects-a1050",
  storageBucket: "projects-a1050.firebasestorage.app",
  messagingSenderId: "529339859235",
  appId: "1:529339859235:web:0de74b03894ad448cb0c96",
  measurementId: "G-Q5T8D0R78M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
