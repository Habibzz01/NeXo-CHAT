// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCQYeIys1xrzEphHRVrGnOpsepmm4kQ42Q",
  authDomain: "xbibz-gptv1.firebaseapp.com",
  databaseURL: "https://xbibz-gptv1-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "xbibz-gptv1",
  storageBucket: "xbibz-gptv1.firebasestorage.app",
  messagingSenderId: "1052726928303",
  appId: "1:1052726928303:web:53003a1e7982ebe400455a",
  measurementId: "G-VG4KMBXZQ6"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// Check if user is logged in
auth.onAuthStateChanged(user => {
  if (user) {
    // User is signed in
    const userId = user.uid;
    
    // Update user status to online
    database.ref('users/' + userId).update({
      status: 'online',
      lastSeen: firebase.database.ServerValue.TIMESTAMP
    });
    
    // Store user data in localStorage for easy access
    localStorage.setItem('userId', userId);
    localStorage.setItem('userEmail', user.email);
    
    // Get user data from database
    database.ref('users/' + userId).once('value').then(snapshot => {
      const userData = snapshot.val();
      if (userData) {
        localStorage.setItem('userName', userData.name || 'User');
        localStorage.setItem('userProfilePic', userData.profilePic || 'https://via.placeholder.com/40');
        localStorage.setItem('userStatus', userData.status || 'online');
      }
    });
    
    // Redirect to chat page if on login or register page
    if (window.location.pathname.includes('login.html') || 
        window.location.pathname.includes('daftar.html') || 
        window.location.pathname === '/' ||
        window.location.pathname.includes('index.html')) {
      window.location.href = 'chat.html';
    }
  } else {
    // User is signed out
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userProfilePic');
    localStorage.removeItem('userStatus');
    
    // Redirect to login page if not on login, register, or forgot password page
    if (!window.location.pathname.includes('login.html') && 
        !window.location.pathname.includes('daftar.html') && 
        !window.location.pathname.includes('lupasandi.html')) {
      window.location.href = 'login.html';
    }
  }
});

// Set user status to offline when page is closed
window.addEventListener('beforeunload', () => {
  const userId = localStorage.getItem('userId');
  if (userId) {
    database.ref('users/' + userId).update({
      status: 'offline',
      lastSeen: firebase.database.ServerValue.TIMESTAMP
    });
  }
});