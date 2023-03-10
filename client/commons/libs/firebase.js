import { initializeApp, getApps } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';
import {
  getAuth,
  browserSessionPersistence,
  setPersistence,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDoLMtJDZi9BhHJssaApAhOfGnfh2cFVEY',
  authDomain: 'typing-guru-89dd6.firebaseapp.com',
  projectId: 'typing-guru-89dd6',
  storageBucket: 'typing-guru-89dd6.appspot.com',
  messagingSenderId: '23979542839',
  appId: '1:23979542839:web:01d843443072903b8d72b2',
  measurementId: 'G-16M70V658D',
};

// Initialize Firebase
export const firebaseInit = (() => {
  if (!getApps().length) {
    console.log('initializing firebase');
    initializeApp(firebaseConfig);
  }
})();
