// ── Firebase initialization ──
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, getDocs, doc, setDoc,
  getDoc, onSnapshot, deleteDoc, updateDoc, deleteField
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAF6vv0cHkzNaheOsNG52fGI9kLeuV4UJg",
  authDomain: "technicalwork-cloud.firebaseapp.com",
  projectId: "technicalwork-cloud",
  storageBucket: "technicalwork-cloud.firebasestorage.app",
  messagingSenderId: "882243863479",
  appId: "1:882243863479:web:2d57dbc9741e45e8cb1e32"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export { collection, getDocs, doc, setDoc, getDoc, onSnapshot, deleteDoc, updateDoc, deleteField };
