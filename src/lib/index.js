// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth'
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCv0eOLm9ju0x5OnDkMfg5aP2PlpQfMMtc",
    authDomain: "app-gotuk.firebaseapp.com",
    projectId: "app-gotuk",
    storageBucket: "app-gotuk.appspot.com",
    messagingSenderId: "788543987645",
    appId: "1:788543987645:web:121bf3115cecf4c063bcd4"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app)
export const db = getFirestore(app)
