const API_URL = 'http://localhost:5000/api';

function showNotification(message, type = 'error') {
  const notification = document.getElementById('notification');
  if (!notification) return;
  
  notification.textContent = message;
  notification.className = `notification ${type}`;
  notification.classList.add('show');
  
  setTimeout(() => {
    notification.classList.remove('show');
  }, 4000);
}

// Initialize Firebase
function initFirebase() {
  if (!window.firebaseConfig) {
    console.error('Firebase config not found');
    return null;
  }
  if (!window.firebase.apps.length) {
    window.firebase.initializeApp(window.firebaseConfig);
  }
  return window.firebase.auth();
}

// Handle Google Sign-In
async function handleGoogleSignIn(auth) {
  const provider = new firebase.auth.GoogleAuthProvider();
  
  try {
    const result = await auth.signInWithPopup(provider);
    const user = result.user;
    const idToken = await user.getIdToken();

    // Login/create user in backend
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({ 
        email: user.email, 
        firebaseUid: user.uid,
        name: user.displayName
      })
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('mongoUserId', data.userId);
      localStorage.setItem('userName', user.displayName || user.email.split('@')[0]);
      localStorage.setItem('userEmail', user.email);
      localStorage.setItem('emailVerified', 'true');
      localStorage.setItem('firebaseUid', user.uid);

      window.location.href = 'dashboard.html';
    } else {
      showNotification(data.error || 'Login failed');
      await auth.signOut();
    }
  } catch (err) {
    console.error('Google sign-in error:', err);
    if (err.code === 'auth/popup-closed-by-user') {
      // User closed popup, do nothing
    } else if (err.code === 'auth/popup-blocked') {
      showNotification('Popup blocked. Please allow popups for this site.');
    } else {
      showNotification(err.message || 'Google sign-in failed');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signup-form');
  const loginForm = document.getElementById('login-form');
  const googleBtn = document.getElementById('google-signin-btn');
  const auth = initFirebase();

  // Google Sign-In button
  if (googleBtn && auth) {
    googleBtn.addEventListener('click', () => handleGoogleSignIn(auth));
  }

  // Password strength checking for signup
  if (signupForm) {
    const passwordInput = document.getElementById('password');
    const strengthBar = document.getElementById('strength-bar');
    const strengthText = document.getElementById('strength-text');

    if (passwordInput) {
      passwordInput.addEventListener('input', (e) => {
        const password = e.target.value;
        const strength = calculatePasswordStrength(password);
        updateStrengthMeter(strength, strengthBar, strengthText);
      });
    }

    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirm-password').value;
      const name = document.getElementById('name')?.value || '';

      if (password !== confirmPassword) {
        showNotification('Passwords do not match');
        return;
      }

      const strength = calculatePasswordStrength(password);
      if (strength === 'weak') {
        showNotification('Password is too weak. Please use a stronger password.');
        return;
      }

      const submitBtn = signupForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating account...';

      try {
        // Create user with Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Update display name if provided
        if (name) {
          await user.updateProfile({ displayName: name });
        }

        // Send verification email via Firebase
        submitBtn.textContent = 'Sending verification email...';
        await user.sendEmailVerification();
        console.log('✅ Verification email sent to:', email);

        // Create user in MongoDB backend
        const response = await fetch(`${API_URL}/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email, 
            name,
            firebaseUid: user.uid
          })
        });

        if (!response.ok) {
          const data = await response.json();
          console.error('Backend signup error:', data.error);
        }

        showNotification('Account created! Please check your email to verify your account.', 'success');
        
        // Sign out so they have to verify first
        await auth.signOut();
        
        setTimeout(() => {
          window.location.href = 'verify-email.html';
        }, 2000);

      } catch (err) {
        console.error('Signup error:', err);
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        
        if (err.code === 'auth/email-already-in-use') {
          showNotification('An account with this email already exists.');
        } else if (err.code === 'auth/weak-password') {
          showNotification('Password is too weak. Use at least 6 characters.');
        } else if (err.code === 'auth/invalid-email') {
          showNotification('Invalid email address.');
        } else {
          showNotification(err.message || 'Signup failed. Please try again.');
        }
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        // Sign in with Firebase
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Check if email is verified
        if (!user.emailVerified) {
          showNotification('Please verify your email before logging in. Check your inbox.');
          
          // Offer to resend verification email
          const resend = confirm('Would you like us to resend the verification email?');
          if (resend) {
            await user.sendEmailVerification();
            showNotification('Verification email sent! Check your inbox.', 'success');
          }
          
          await auth.signOut();
          return;
        }

        // Get Firebase ID token
        const idToken = await user.getIdToken();

        // Login to backend
        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({ email, firebaseUid: user.uid })
        });

        const data = await response.json();

        if (response.ok) {
          localStorage.setItem('mongoUserId', data.userId);
          localStorage.setItem('userName', data.name || user.displayName || email.split('@')[0]);
          localStorage.setItem('userEmail', email);
          localStorage.setItem('emailVerified', 'true');
          localStorage.setItem('firebaseUid', user.uid);

          window.location.href = 'dashboard.html';
        } else {
          showNotification(data.error || 'Login failed');
          await auth.signOut();
        }
      } catch (err) {
        console.error('Login error:', err);
        if (err.code === 'auth/user-not-found') {
          showNotification('No account found with this email.');
        } else if (err.code === 'auth/wrong-password') {
          showNotification('Incorrect password.');
        } else if (err.code === 'auth/invalid-email') {
          showNotification('Invalid email address.');
        } else if (err.code === 'auth/too-many-requests') {
          showNotification('Too many failed attempts. Please try again later.');
        } else {
          showNotification(err.message || 'Login failed. Please try again.');
        }
      }
    });
  }
});

function calculatePasswordStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score < 2) return 'weak';
  if (score < 3) return 'fair';
  if (score < 4) return 'good';
  return 'strong';
}

function updateStrengthMeter(strength, bar, text) {
  if (!bar || !text) return;

  bar.className = `strength-bar ${strength}`;
  text.className = `strength-text ${strength}`;

  const messages = {
    weak: 'Weak password',
    fair: 'Fair password',
    good: 'Good password',
    strong: 'Strong password'
  };

  text.textContent = messages[strength];
}
