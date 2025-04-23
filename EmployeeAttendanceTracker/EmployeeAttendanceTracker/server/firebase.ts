import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, where, Timestamp, enableIndexedDbPersistence } from 'firebase/firestore';
import { format } from 'date-fns';

// Firebase configuration - prioritize environment variables or use hardcoded values as fallback
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyCOafr6BobBWheqBwo1So0nbPRXyIfFNBY",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "employeedata-e1fc6.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "employeedata-e1fc6",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "employeedata-e1fc6.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "998855411527",
  appId: process.env.FIREBASE_APP_ID || "1:998855411527:web:4b35ca4cdc726e954b6e62",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-WCRPSE3H88"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firestore instance
const db = getFirestore(app);

// Note: We don't enable offline persistence on the server side
// This would be used in the client-side code only

console.log('Firebase initialized successfully');

// Collection references
const attendanceCollection = collection(db, 'attendance');

export { db, attendanceCollection, Timestamp };