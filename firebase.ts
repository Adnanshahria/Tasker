// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBIfwhRAHC3VQLO4jRnT1WB1rBAABXhwu0",
    authDomain: "habit-tracker---excel-style.firebaseapp.com",
    projectId: "habit-tracker---excel-style",
    storageBucket: "habit-tracker---excel-style.firebasestorage.app",
    messagingSenderId: "968559281104",
    appId: "1:968559281104:web:cc480d63b91fdc0bafafd5",
    measurementId: "G-1FPKK96ZEN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
