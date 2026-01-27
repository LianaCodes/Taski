/*
  Firebase config example.
  1) Create a Firebase project at https://console.firebase.google.com/
  2) Enable Email/Password sign-in in Authentication -> Sign-in method
  3) Copy your web app config and paste into a new file named `firebase-config.js`
  4) Include that file in your HTML pages BEFORE `auth.js`, for example in `login.html`:

     <script src="firebase-config.js"></script>
     <script src="auth.js"></script>

  NOTE: Do NOT commit your real `firebase-config.js` to a public repo if it contains secrets.
*/

window.firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  // Optional fields below if present in your Firebase config
  // storageBucket: "YOUR_PROJECT.appspot.com",
  // messagingSenderId: "...",
  // appId: "..."
};
