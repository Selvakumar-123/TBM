import admin from 'firebase-admin';
import { type AttendanceRecord, type InsertAttendance } from "@shared/schema";
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: `firebase-adminsdk@${process.env.FIREBASE_PROJECT_ID}.iam.gserviceaccount.com`,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
    });
    
    console.log('Firebase Admin initialized successfully');
  }
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
}

// Get Firestore Admin instance
export const firestoreAdmin = getFirestore();

// Re-export Timestamp for consistent usage
import { Timestamp as FirestoreTimestamp } from 'firebase-admin/firestore';
export const Timestamp = FirestoreTimestamp;

// Collection references
export const attendanceCollectionAdmin = firestoreAdmin.collection('attendance');