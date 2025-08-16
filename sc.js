// Global variables
let currentUser = null;
let currentChatId = null;
let conversations = [];
let users = [];
let files = [];
let messages = [];
let selectedFile = null;
let editingMessageId = null;

// Call variables
let localStream = null;
let remoteStream = null;
let peerConnection = null;
let currentCall = null;
let callTimer = null;
let callSeconds = 0;
let isCallActive = false;

// WebRTC configuration
const rtcConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

// DOM elements
document.addEventListener('DOMContentLoaded', function() {
  // Initialize based on current page
  const currentPath = window.location.pathname;
  
  if (currentPath.includes('index.html') || currentPath === '/') {
    initializeLandingPage();
  } else if (currentPath.includes('login.html')) {
    initializeLoginPage();
  } else if (currentPath.includes('daftar.html')) {
    initializeRegisterPage();
  } else if (currentPath.includes('lupasandi.html')) {
    initializeForgotPasswordPage();
  } else if (currentPath.includes('chat.html')) {
    initializeChatPage();
  } else if (currentPath.includes('profil.html')) {
    initializeProfilePage();
  } else if (currentPath.includes('caripengguna.html')) {
    initializeSearchUserPage();
  } else if (currentPath.includes('memoriyangsudahdigunakan.html')) {
    initializeMemoryPage();
  } else if (currentPath.includes('call.html')) {
    initializeCallPage();
  }
  
  // Initialize modal close buttons
  initializeModals();
  
  // Initialize tabs
  initializeTabs();
});

// Landing Page Functions
function initializeLandingPage() {
  // Add animations to feature cards
  const featureCards = document.querySelectorAll('.feature-card');
  featureCards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.1}s`;
    card.classList.add('fade-in');
  });
}

// Login Page Functions
function initializeLoginPage() {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      // Show loading state
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
      submitBtn.disabled = true;
      
      // Sign in with Firebase
      auth.signInWithEmailAndPassword(email, password)
        .then(userCredential => {
          // Signed in successfully
          showNotification('Login berhasil!', 'success');
          window.location.href = 'chat.html';
        })
        .catch(error => {
          // Handle errors
          let errorMessage = 'Terjadi kesalahan saat login.';
          if (error.code === 'auth/user-not-found') {
            errorMessage = 'Pengguna tidak ditemukan.';
          } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'Kata sandi salah.';
          } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Email tidak valid.';
          }
          
          showNotification(errorMessage, 'error');
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        });
    });
  }
  
  // Google login button
  const googleLoginBtn = document.querySelector('.btn-google');
  if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', function() {
      const provider = new firebase.auth.GoogleAuthProvider();
      auth.signInWithPopup(provider)
        .then(result => {
          showNotification('Login berhasil dengan Google!', 'success');
          window.location.href = 'chat.html';
        })
        .catch(error => {
          showNotification('Gagal login dengan Google: ' + error.message, 'error');
        });
    });
  }
}

// Register Page Functions
function initializeRegisterPage() {
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const name = document.getElementById('nama').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      
      // Validate passwords match
      if (password !== confirmPassword) {
        showNotification('Kata sandi tidak cocok!', 'error');
        return;
      }
      
      // Validate password length
      if (password.length < 6) {
        showNotification('Kata sandi minimal 6 karakter!', 'error');
        return;
      }
      
      // Show loading state
      const submitBtn = registerForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mendaftar...';
      submitBtn.disabled = true;
      
      // Create user with Firebase
      auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
          // Created user successfully
          const user = userCredential.user;
          
          // Add user to database
          database.ref('users/' + user.uid).set({
            name: name,
            email: email,
            status: 'online',
            lastSeen: firebase.database.ServerValue.TIMESTAMP,
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            profilePic: 'https://via.placeholder.com/40'
          });
          
          showNotification('Pendaftaran berhasil!', 'success');
          window.location.href = 'chat.html';
        })
        .catch(error => {
          // Handle errors
          let errorMessage = 'Terjadi kesalahan saat mendaftar.';
          if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'Email sudah digunakan.';
          } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Email tidak valid.';
          } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Kata sandi terlalu lemah.';
          }
          
          showNotification(errorMessage, 'error');
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        });
    });
  }
  
  // Google register button
  const googleRegisterBtn = document.querySelector('.btn-google');
  if (googleRegisterBtn) {
    googleRegisterBtn.addEventListener('click', function() {
      const provider = new firebase.auth.GoogleAuthProvider();
      auth.signInWithPopup(provider)
        .then(result => {
          const user = result.user;
          
          // Check if user exists in database
          database.ref('users/' + user.uid).once('value').then(snapshot => {
            if (!snapshot.exists()) {
              // Add new user to database
              database.ref('users/' + user.uid).set({
                name: user.displayName,
                email: user.email,
                status: 'online',
                lastSeen: firebase.database.ServerValue.TIMESTAMP,
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                profilePic: user.photoURL || 'https://via.placeholder.com/40'
              });
            }
            
            showNotification('Pendaftaran berhasil dengan Google!', 'success');
            window.location.href = 'chat.html';
          });
        })
        .catch(error => {
          showNotification('Gagal mendaftar dengan Google: ' + error.message, 'error');
        });
    });
  }
}

// Forgot Password Page Functions
function initializeForgotPasswordPage() {
  const forgotPasswordForm = document.getElementById('forgotPasswordForm');
  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const email = document.getElementById('email').value;
      
      // Show loading state
      const submitBtn = forgotPasswordForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';
      submitBtn.disabled = true;
      
      // Send password reset email
      auth.sendPasswordResetEmail(email)
        .then(() => {
          showNotification('Tautan reset kata sandi telah dikirim ke email Anda!', 'success');
          forgotPasswordForm.reset();
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        })
        .catch(error => {
          // Handle errors
          let errorMessage = 'Terjadi kesalahan saat mengirim tautan reset.';
          if (error.code === 'auth/user-not-found') {
            errorMessage = 'Pengguna dengan email ini tidak ditemukan.';
          } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Email tidak valid.';
          }
          
          showNotification(errorMessage, 'error');
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        });
    });
  }
}

// Chat Page Functions
function initializeChatPage() {
  // Check if user is logged in
  const userId = localStorage.getItem('userId');
  if (!userId) {
    window.location.href = 'login.html';
    return;
  }
  
  // Update sidebar user info
  updateSidebarUserInfo();
  
  // Load conversations
  loadConversations();
  
  // Initialize chat input
  initializeChatInput();
  
  // Initialize search conversation
  initializeSearchConversation();
  
  // Initialize call functionality
  initializeCallFunctionality();
  
  // Listen for new conversations
  database.ref('conversations').orderByChild('participants/' + userId).equalTo(true).on('value', snapshot => {
    loadConversations();
  });
}

function updateSidebarUserInfo() {
  const userName = localStorage.getItem('userName');
  const userProfilePic = localStorage.getItem('userProfilePic');
  
  const sidebarUserName = document.getElementById('sidebarUserName');
  const sidebarProfilePic = document.getElementById('sidebarProfilePic');
  
  if (sidebarUserName) sidebarUserName.textContent = userName;
  if (sidebarProfilePic) sidebarProfilePic.src = userProfilePic;
}

function loadConversations() {
  const userId = localStorage.getItem('userId');
  const conversationsList = document.getElementById('conversationsList');
  
  if (!conversationsList) return;
  
  // Clear existing conversations
  conversationsList.innerHTML = '';
  
  // Get conversations from database
  database.ref('conversations').orderByChild('participants/' + userId).equalTo(true).once('value').then(snapshot => {
    conversations = [];
    
    snapshot.forEach(childSnapshot => {
      const conversation = childSnapshot.val();
      conversation.id = childSnapshot.key;
      conversations.push(conversation);
    });
    
    // Sort conversations by last message timestamp
    conversations.sort((a, b) => {
      const aTime = a.lastMessageTime || 0;
      const bTime = b.lastMessageTime || 0;
      return bTime - aTime;
    });
    
    // Display conversations
    if (conversations.length === 0) {
      conversationsList.innerHTML = '<div class="empty-conversations"><p>Belum ada percakapan</p></div>';
    } else {
      conversations.forEach(conversation => {
        const conversationElement = createConversationElement(conversation);
        conversationsList.appendChild(conversationElement);
      });
    }
  }).catch(error => {
    console.error('Error loading conversations:', error);
    conversationsList.innerHTML = '<div class="error"><p>Gagal memuat percakapan</p></div>';
  });
}

function createConversationElement(conversation) {
  const conversationElement = document.createElement('div');
  conversationElement.className = 'conversation';
  conversationElement.dataset.id = conversation.id;
  
  // Get other participant
  const userId = localStorage.getItem('userId');
  let otherUserId = null;
  
  for (const participantId in conversation.participants) {
    if (participantId !== userId) {
      otherUserId = participantId;
      break;
    }
  }
  
  if (!otherUserId) return conversationElement;
  
  // Get other user info
  database.ref('users/' + otherUserId).once('value').then(snapshot => {
    const otherUser = snapshot.val();
    if (!otherUser) return;
    
    const lastMessage = conversation.lastMessage || '';
    const lastMessageTime = conversation.lastMessageTime ? formatTime(conversation.lastMessageTime) : '';
    const unreadCount = conversation.unreadCount && conversation.unreadCount[userId] ? conversation.unreadCount[userId] : 0;
    
    conversationElement.innerHTML = `
      <img src="${otherUser.profilePic || 'https://via.placeholder.com/40'}" alt="${otherUser.name}">
      <div class="conversation-info">
        <h3>${otherUser.name}</h3>
        <p>${lastMessage}</p>
      </div>
      <div class="conversation-meta">
        <span class="time">${lastMessageTime}</span>
        ${unreadCount > 0 ? `<span class="unread-count">${unreadCount}</span>` : ''}
      </div>
    `;
    
    conversationElement.addEventListener('click', () => {
      openConversation(conversation.id, otherUser);
    });
  });
  
  return conversationElement;
}

function openConversation(conversationId, otherUser) {
  currentChatId = conversationId;
  
  // Update chat header
  const currentChatName = document.getElementById('currentChatName');
  const currentChatStatus = document.getElementById('currentChatStatus');
  const currentChatProfilePic = document.getElementById('currentChatProfilePic');
  
  if (currentChatName) currentChatName.textContent = otherUser.name;
  if (currentChatStatus) currentChatStatus.textContent = otherUser.status === 'online' ? 'Online' : 'Offline';
  if (currentChatProfilePic) currentChatProfilePic.src = otherUser.profilePic || 'https://via.placeholder.com/40';
  
  // Enable message input
  const messageInput = document.getElementById('messageInput');
  const sendMessageBtn = document.getElementById('sendMessageBtn');
  
  if (messageInput) messageInput.disabled = false;
  if (sendMessageBtn) sendMessageBtn.disabled = false;
  
  // Mark conversation as read
  const userId = localStorage.getItem('userId');
  database.ref('conversations/' + conversationId + '/unreadCount/' + userId).remove();
  
  // Load messages
  loadMessages(conversationId);
  
  // Highlight active conversation
  document.querySelectorAll('.conversation').forEach(el => {
    el.classList.remove('active');
  });
  
  const activeConversation = document.querySelector(`.conversation[data-id="${conversationId}"]`);
  if (activeConversation) activeConversation.classList.add('active');
}

function loadMessages(conversationId) {
  const chatMessages = document.getElementById('chatMessages');
  
  if (!chatMessages) return;
  
  // Clear existing messages
  chatMessages.innerHTML = '';
  
  // Get messages from database
  database.ref('messages').orderByChild('conversationId').equalTo(conversationId).once('value').then(snapshot => {
    messages = [];
    
    snapshot.forEach(childSnapshot => {
      const message = childSnapshot.val();
      message.id = childSnapshot.key;
      messages.push(message);
    });
    
    // Sort messages by timestamp
    messages.sort((a, b) => a.timestamp - b.timestamp);
    
    // Display messages
    if (messages.length === 0) {
      chatMessages.innerHTML = '<div class="empty-chat-messages"><p>Belum ada pesan. Mulai chatting sekarang!</p></div>';
    } else {
      messages.forEach(message => {
        const messageElement = createMessageElement(message);
        chatMessages.appendChild(messageElement);
      });
      
      // Scroll to bottom
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }).catch(error => {
    console.error('Error loading messages:', error);
    chatMessages.innerHTML = '<div class="error"><p>Gagal memuat pesan</p></div>';
  });
  
  // Listen for new messages
  database.ref('messages').orderByChild('conversationId').equalTo(conversationId).on('child_added', snapshot => {
    const message = snapshot.val();
    message.id = snapshot.key;
    
    // Check if message already exists
    const existingMessage = messages.find(m => m.id === message.id);
    if (existingMessage) return;
    
    messages.push(message);
    
    // Remove empty message indicator if it exists
    const emptyMessages = document.querySelector('.empty-chat-messages');
    if (emptyMessages) emptyMessages.remove();
    
    // Add message to chat
    const messageElement = createMessageElement(message);
    chatMessages.appendChild(messageElement);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Update conversation last message
    const userId = localStorage.getItem('userId');
    if (message.senderId !== userId) {
      // Increment unread count if message is not from current user
      const unreadCountRef = database.ref('conversations/' + conversationId + '/unreadCount/' + userId);
      unreadCountRef.transaction(currentCount => {
        return (currentCount || 0) + 1;
      });
    }
    
    database.ref('conversations/' + conversationId).update({
      lastMessage: message.type === 'text' ? message.text : 'Mengirim file',
      lastMessageTime: message.timestamp
    });
  });
  
  // Listen for updated messages
  database.ref('messages').orderByChild('conversationId').equalTo(conversationId).on('child_changed', snapshot => {
    const message = snapshot.val();
    message.id = snapshot.key;
    
    // Find and update message in UI
    const messageElement = document.querySelector(`.message[data-id="${message.id}"]`);
    if (messageElement) {
      const newMessageElement = createMessageElement(message);
      messageElement.parentNode.replaceChild(newMessageElement, messageElement);
    }
  });
  
  // Listen for deleted messages
  database.ref('messages').orderByChild('conversationId').equalTo(conversationId).on('child_removed', snapshot => {
    const messageId = snapshot.key;
    
    // Remove message from UI
    const messageElement = document.querySelector(`.message[data-id="${messageId}"]`);
    if (messageElement) {
      messageElement.remove();
    }
  });
}

function createMessageElement(message) {
  const messageElement = document.createElement('div');
  messageElement.className = 'message';
  messageElement.dataset.id = message.id;
  
  const userId = localStorage.getItem('userId');
  const isOwnMessage = message.senderId === userId;
  
  if (isOwnMessage) {
    messageElement.classList.add('sent');
  } else {
    messageElement.classList.add('received');
  }
  
  const formattedTime = formatTime(message.timestamp);
  
  if (message.type === 'text') {
    messageElement.innerHTML = `
      <div class="message-content">${message.text}</div>
      <div class="message-meta">
        <span class="time">${formattedTime}</span>
        ${isOwnMessage ? `<span class="status ${message.read ? 'read' : 'sent'}"><i class="fas fa-check${message.read ? '-double' : ''}"></i></span>` : ''}
      </div>
      ${isOwnMessage ? `
        <div class="message-actions">
          <button class="btn-icon" onclick="editMessage('${message.id}')" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-icon" onclick="deleteMessage('${message.id}')" title="Hapus">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      ` : ''}
    `;
  } else if (message.type === 'file') {
    const fileIcon = getFileIcon(message.fileType);
    const fileSize = formatFileSize(message.fileSize);
    
    messageElement.innerHTML = `
      <div class="message-content file-message">
        <div class="file-icon">
          <i class="${fileIcon}"></i>
        </div>
        <div class="file-info">
          <h4>${message.fileName}</h4>
          <p>${fileSize}</p>
        </div>
        <button class="btn-icon download-btn" onclick="downloadFile('${message.id}')" title="Download">
          <i class="fas fa-download"></i>
        </button>
      </div>
      <div class="message-meta">
        <span class="time">${formattedTime}</span>
        ${isOwnMessage ? `<span class="status ${message.read ? 'read' : 'sent'}"><i class="fas fa-check${message.read ? '-double' : ''}"></i></span>` : ''}
      </div>
      ${isOwnMessage ? `
        <div class="message-actions">
          <button class="btn-icon" onclick="deleteMessage('${message.id}')" title="Hapus">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      ` : ''}
    `;
  }
  
  return messageElement;
}

function initializeChatInput() {
  const messageInput = document.getElementById('messageInput');
  const sendMessageBtn = document.getElementById('sendMessageBtn');
  const attachFileBtn = document.getElementById('attachFileBtn');
  const fileInput = document.getElementById('fileInput');
  
  if (messageInput && sendMessageBtn) {
    // Send message on button click
    sendMessageBtn.addEventListener('click', sendMessage);
    
    // Send message on Enter key
    messageInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
  }
  
  if (attachFileBtn && fileInput) {
    attachFileBtn.addEventListener('click', function() {
      fileInput.click();
    });
    
    fileInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        // Check file size (max 50MB)
        if (file.size > 50 * 1024 * 1024) {
          showNotification('Ukuran file maksimal 50MB!', 'error');
          return;
        }
        
        // Preview file
        previewFile(file);
      }
    });
  }
}

function sendMessage() {
  const messageInput = document.getElementById('messageInput');
  const text = messageInput.value.trim();
  
  if (!text || !currentChatId) return;
  
  const userId = localStorage.getItem('userId');
  
  // Create message object
  const message = {
    conversationId: currentChatId,
    senderId: userId,
    text: text,
    type: 'text',
    timestamp: firebase.database.ServerValue.TIMESTAMP,
    read: false
  };
  
  // Add message to database
  database.ref('messages').push(message).then(() => {
    // Clear input
    messageInput.value = '';
    
    // Update conversation last message
    database.ref('conversations/' + currentChatId).update({
      lastMessage: text,
      lastMessageTime: firebase.database.ServerValue.TIMESTAMP
    });
  }).catch(error => {
    console.error('Error sending message:', error);
    showNotification('Gagal mengirim pesan', 'error');
  });
}

function previewFile(file) {
  selectedFile = file;
  
  const filePreviewModal = document.getElementById('filePreviewModal');
  const filePreview = document.getElementById('filePreview');
  const fileName = document.getElementById('fileName');
  const fileSize = document.getElementById('fileSize');
  
  if (!filePreviewModal || !filePreview || !fileName || !fileSize) return;
  
  // Display file info
  fileName.textContent = file.name;
  fileSize.textContent = formatFileSize(file.size);
  
  // Preview file based on type
  if (file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = function(e) {
      filePreview.innerHTML = `<img src="${e.target.result}" alt="${file.name}">`;
    };
    reader.readAsDataURL(file);
  } else if (file.type === 'application/pdf') {
    filePreview.innerHTML = `<div class="file-preview-placeholder"><i class="fas fa-file-pdf"></i></div>`;
  } else if (file.type.includes('text/')) {
    const reader = new FileReader();
    reader.onload = function(e) {
      filePreview.innerHTML = `<div class="text-preview">${e.target.result}</div>`;
    };
    reader.readAsText(file);
  } else {
    filePreview.innerHTML = `<div class="file-preview-placeholder"><i class="fas fa-file"></i></div>`;
  }
  
  // Show modal
  filePreviewModal.style.display = 'flex';
  
  // Set up send file button
  const sendFileBtn = document.getElementById('sendFileBtn');
  if (sendFileBtn) {
    sendFileBtn.onclick = function() {
      sendFile(file);
      filePreviewModal.style.display = 'none';
    };
  }
}

function sendFile(file) {
  if (!currentChatId) return;
  
  const userId = localStorage.getItem('userId');
  
  // Convert file to base64
  const reader = new FileReader();
  reader.onload = function(e) {
    const base64 = e.target.result.split(',')[1]; // Remove data URL prefix
    
    // Create message object
    const message = {
      conversationId: currentChatId,
      senderId: userId,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      fileData: base64,
      type: 'file',
      timestamp: firebase.database.ServerValue.TIMESTAMP,
      read: false
    };
    
    // Add message to database
    database.ref('messages').push(message).then(() => {
      // Update conversation last message
      database.ref('conversations/' + currentChatId).update({
        lastMessage: 'Mengirim file',
        lastMessageTime: firebase.database.ServerValue.TIMESTAMP
      });
      
      showNotification('File berhasil dikirim', 'success');
    }).catch(error => {
      console.error('Error sending file:', error);
      showNotification('Gagal mengirim file', 'error');
    });
  };
  
  reader.readAsDataURL(file);
}

function downloadFile(messageId) {
  const message = messages.find(m => m.id === messageId);
  if (!message || message.type !== 'file') return;
  
  // Convert base64 to blob
  const byteCharacters = atob(message.fileData);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: message.fileType });
  
  // Create download link
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = message.fileName;
  document.body.appendChild(a);
  a.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

function editMessage(messageId) {
  const message = messages.find(m => m.id === messageId);
  if (!message || message.type !== 'text') return;
  
  editingMessageId = messageId;
  
  const editMessageModal = document.getElementById('editMessageModal');
  const editMessageInput = document.getElementById('editMessageInput');
  
  if (!editMessageModal || !editMessageInput) return;
  
  // Set current message text
  editMessageInput.value = message.text;
  
  // Show modal
  editMessageModal.style.display = 'flex';
  
  // Set up save button
  const saveEditBtn = document.getElementById('saveEditBtn');
  if (saveEditBtn) {
    saveEditBtn.onclick = function() {
      const newText = editMessageInput.value.trim();
      if (newText) {
        // Update message in database
        database.ref('messages/' + messageId).update({
          text: newText,
          edited: true,
          editedAt: firebase.database.ServerValue.TIMESTAMP
        }).then(() => {
          showNotification('Pesan berhasil diperbarui', 'success');
          editMessageModal.style.display = 'none';
          editingMessageId = null;
        }).catch(error => {
          console.error('Error updating message:', error);
          showNotification('Gagal memperbarui pesan', 'error');
        });
      }
    };
  }
}

function deleteMessage(messageId) {
  if (confirm('Apakah Anda yakin ingin menghapus pesan ini?')) {
    // Delete message from database
    database.ref('messages/' + messageId).remove()
      .then(() => {
        showNotification('Pesan berhasil dihapus', 'success');
      })
      .catch(error => {
        console.error('Error deleting message:', error);
        showNotification('Gagal menghapus pesan', 'error');
      });
  }
}

function initializeSearchConversation() {
  const searchConversation = document.getElementById('searchConversation');
  if (!searchConversation) return;
  
  searchConversation.addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    // Filter conversations based on search term
    document.querySelectorAll('.conversation').forEach(conversationElement => {
      const conversationId = conversationElement.dataset.id;
      const conversation = conversations.find(c => c.id === conversationId);
      
      if (!conversation) return;
      
      // Get other participant
      const userId = localStorage.getItem('userId');
      let otherUserId = null;
      
      for (const participantId in conversation.participants) {
        if (participantId !== userId) {
          otherUserId = participantId;
          break;
        }
      }
      
      if (!otherUserId) return;
      
      // Get other user info
      database.ref('users/' + otherUserId).once('value').then(snapshot => {
        const otherUser = snapshot.val();
        if (!otherUser) return;
        
        const userName = otherUser.name.toLowerCase();
        const lastMessage = (conversation.lastMessage || '').toLowerCase();
        
        if (userName.includes(searchTerm) || lastMessage.includes(searchTerm)) {
          conversationElement.style.display = 'flex';
        } else {
          conversationElement.style.display = 'none';
        }
      });
    });
  });
}

// Profile Page Functions
function initializeProfilePage() {
  // Check if user is logged in
  const userId = localStorage.getItem('userId');
  if (!userId) {
    window.location.href = 'login.html';
    return;
  }
  
  // Update sidebar user info
  updateSidebarUserInfo();
  
  // Load conversations
  loadConversations();
  
  // Load profile data
  loadProfileData();
  
  // Initialize profile form
  initializeProfileForm();
  
  // Initialize profile picture upload
  initializeProfilePictureUpload();
  
  // Initialize settings
  initializeSettings();
}

function loadProfileData() {
  const userId = localStorage.getItem('userId');
  
  database.ref('users/' + userId).once('value').then(snapshot => {
    const userData = snapshot.val();
    if (!userData) return;
    
    // Update profile form fields
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profileStatus = document.getElementById('profileStatus');
    const profilePhone = document.getElementById('profilePhone');
    const profilePicture = document.getElementById('profilePicture');
    
    if (profileName) profileName.value = userData.name || '';
    if (profileEmail) profileEmail.value = userData.email || '';
    if (profileStatus) profileStatus.value = userData.userStatus || '';
    if (profilePhone) profilePhone.value = userData.phone || '';
    if (profilePicture) profilePicture.src = userData.profilePic || 'https://via.placeholder.com/150';
    
    // Update notification toggle
    const notificationToggle = document.getElementById('notificationToggle');
    if (notificationToggle) notificationToggle.checked = userData.notifications !== false;
    
    // Update dark mode toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) darkModeToggle.checked = userData.darkMode || false;
    
    // Apply dark mode if enabled
    if (userData.darkMode) {
      document.body.classList.add('dark-mode');
    }
    
    // Store original values for reset functionality
    localStorage.setItem('originalProfileName', userData.name || '');
    localStorage.setItem('originalProfileStatus', userData.userStatus || '');
    localStorage.setItem('originalProfilePhone', userData.phone || '');
    localStorage.setItem('originalProfilePic', userData.profilePic || 'https://via.placeholder.com/150');
  });
}

function initializeProfileForm() {
  const profileForm = document.getElementById('profileForm');
  
  if (profileForm) {
    profileForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const userId = localStorage.getItem('userId');
      const name = document.getElementById('profileName').value;
      const status = document.getElementById('profileStatus').value;
      const phone = document.getElementById('profilePhone').value;
      
      // Show loading state
      const submitBtn = profileForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
      submitBtn.disabled = true;
      
      // Update user data in database
      database.ref('users/' + userId).update({
        name: name,
        userStatus: status,
        phone: phone
      }).then(() => {
        // Update localStorage
        localStorage.setItem('userName', name);
        
        // Update sidebar
        updateSidebarUserInfo();
        
        showNotification('Profil berhasil diperbarui', 'success');
        
        // Update original values
        localStorage.setItem('originalProfileName', name);
        localStorage.setItem('originalProfileStatus', status);
        localStorage.setItem('originalProfilePhone', phone);
        
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }).catch(error => {
        console.error('Error updating profile:', error);
        showNotification('Gagal memperbarui profil', 'error');
        
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      });
    });
    
    // Reset button functionality
    const resetBtn = profileForm.querySelector('.btn-secondary');
    if (resetBtn) {
      resetBtn.addEventListener('click', resetProfileForm);
    }
  }
}

function resetProfileForm() {
  const profileName = document.getElementById('profileName');
  const profileStatus = document.getElementById('profileStatus');
  const profilePhone = document.getElementById('profilePhone');
  const profilePicture = document.getElementById('profilePicture');
  
  if (profileName) profileName.value = localStorage.getItem('originalProfileName') || '';
  if (profileStatus) profileStatus.value = localStorage.getItem('originalProfileStatus') || '';
  if (profilePhone) profilePhone.value = localStorage.getItem('originalProfilePhone') || '';
  if (profilePicture) profilePicture.src = localStorage.getItem('originalProfilePic') || 'https://via.placeholder.com/150';
}

function initializeProfilePictureUpload() {
  const profilePictureInput = document.getElementById('profilePictureInput');
  
  if (profilePictureInput) {
    profilePictureInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        // Check file size (max 30MB)
        if (file.size > 30 * 1024 * 1024) {
          showNotification('Ukuran file maksimal 30MB!', 'error');
          return;
        }
        
        // Check file type
        if (!file.type.startsWith('image/')) {
          showNotification('Hanya file gambar yang diperbolehkan!', 'error');
          return;
        }
        
        // Show loading state
        const profilePicture = document.getElementById('profilePicture');
        const originalSrc = profilePicture.src;
        profilePicture.src = 'https://via.placeholder.com/150?text=Loading...';
        
        // Convert file to base64
        const reader = new FileReader();
        reader.onload = function(e) {
          const base64 = e.target.result;
          
          // Update profile picture
          profilePicture.src = base64;
          
          // Save to database
          const userId = localStorage.getItem('userId');
          database.ref('users/' + userId).update({
            profilePic: base64
          }).then(() => {
            // Update localStorage
            localStorage.setItem('userProfilePic', base64);
            localStorage.setItem('originalProfilePic', base64);
            
            // Update sidebar
            updateSidebarUserInfo();
            
            showNotification('Foto profil berhasil diperbarui', 'success');
          }).catch(error => {
            console.error('Error updating profile picture:', error);
            showNotification('Gagal memperbarui foto profil', 'error');
            
            // Revert to original picture
            profilePicture.src = originalSrc;
          });
        };
        
        reader.readAsDataURL(file);
      }
    });
  }
}

function initializeSettings() {
  // Change password button
  const changePasswordBtn = document.getElementById('changePasswordBtn');
  if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', function() {
      const changePasswordModal = document.getElementById('changePasswordModal');
      if (changePasswordModal) {
        changePasswordModal.style.display = 'flex';
        
        // Set up change password form
        const changePasswordForm = document.getElementById('changePasswordForm');
        if (changePasswordForm) {
          changePasswordForm.onsubmit = function(e) {
            e.preventDefault();
            
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmNewPassword = document.getElementById('confirmNewPassword').value;
            
            // Validate passwords
            if (newPassword !== confirmNewPassword) {
              showNotification('Kata sandi baru tidak cocok!', 'error');
              return;
            }
            
            if (newPassword.length < 6) {
              showNotification('Kata sandi minimal 6 karakter!', 'error');
              return;
            }
            
            // Show loading state
            const savePasswordBtn = document.getElementById('savePasswordBtn');
            const originalText = savePasswordBtn.textContent;
            savePasswordBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memperbarui...';
            savePasswordBtn.disabled = true;
            
            // Get current user
            const user = auth.currentUser;
            
            // Re-authenticate user
            const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
            user.reauthenticateWithCredential(credential)
              .then(() => {
                // Update password
                return user.updatePassword(newPassword);
              })
              .then(() => {
                showNotification('Kata sandi berhasil diperbarui', 'success');
                changePasswordModal.style.display = 'none';
                changePasswordForm.reset();
                
                savePasswordBtn.textContent = originalText;
                savePasswordBtn.disabled = false;
              })
              .catch(error => {
                console.error('Error updating password:', error);
                
                let errorMessage = 'Gagal memperbarui kata sandi.';
                if (error.code === 'auth/wrong-password') {
                  errorMessage = 'Kata sandi saat ini salah.';
                }
                
                showNotification(errorMessage, 'error');
                
                savePasswordBtn.textContent = originalText;
                savePasswordBtn.disabled = false;
              });
          };
        }
        
        // Set up cancel button
        const cancelChangePasswordBtn = document.getElementById('cancelChangePasswordBtn');
        if (cancelChangePasswordBtn) {
          cancelChangePasswordBtn.onclick = function() {
            changePasswordModal.style.display = 'none';
            document.getElementById('changePasswordForm').reset();
          };
        }
      }
    });
  }
  
  // Notification toggle
  const notificationToggle = document.getElementById('notificationToggle');
  if (notificationToggle) {
    notificationToggle.addEventListener('change', function() {
      const userId = localStorage.getItem('userId');
      
      database.ref('users/' + userId).update({
        notifications: this.checked
      }).then(() => {
        showNotification(
          this.checked ? 'Notifikasi diaktifkan' : 'Notifikasi dinonaktifkan', 
          'success'
        );
      }).catch(error => {
        console.error('Error updating notification setting:', error);
        showNotification('Gagal memperbarui pengaturan notifikasi', 'error');
        
        // Revert toggle
        this.checked = !this.checked;
      });
    });
  }
  
  // Dark mode toggle
  const darkModeToggle = document.getElementById('darkModeToggle');
  if (darkModeToggle) {
    darkModeToggle.addEventListener('change', function() {
      const userId = localStorage.getItem('userId');
      
      database.ref('users/' + userId).update({
        darkMode: this.checked
      }).then(() => {
        if (this.checked) {
          document.body.classList.add('dark-mode');
          showNotification('Mode gelap diaktifkan', 'success');
        } else {
          document.body.classList.remove('dark-mode');
          showNotification('Mode gelap dinonaktifkan', 'success');
        }
      }).catch(error => {
        console.error('Error updating dark mode setting:', error);
        showNotification('Gagal memperbarui pengaturan mode gelap', 'error');
        
        // Revert toggle
        this.checked = !this.checked;
      });
    });
  }
  
  // Privacy settings button
  const privacySettingsBtn = document.getElementById('privacySettingsBtn');
  if (privacySettingsBtn) {
    privacySettingsBtn.addEventListener('click', function() {
      showNotification('Pengaturan privasi akan segera hadir', 'info');
    });
  }
  
  // Delete account button
  const deleteAccountBtn = document.getElementById('deleteAccountBtn');
  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', function() {
      const deleteAccountModal = document.getElementById('deleteAccountModal');
      if (deleteAccountModal) {
        deleteAccountModal.style.display = 'flex';
        
        // Set up confirm delete button
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        if (confirmDeleteBtn) {
          confirmDeleteBtn.onclick = function() {
            const password = document.getElementById('deletePassword').value;
            
            if (!password) {
              showNotification('Masukkan kata sandi untuk konfirmasi', 'error');
              return;
            }
            
            // Show loading state
            const originalText = confirmDeleteBtn.textContent;
            confirmDeleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menghapus...';
            confirmDeleteBtn.disabled = true;
            
            // Get current user
            const user = auth.currentUser;
            
            // Re-authenticate user
            const credential = firebase.auth.EmailAuthProvider.credential(user.email, password);
            user.reauthenticateWithCredential(credential)
              .then(() => {
                // Delete user data from database
                const userId = user.uid;
                return database.ref('users/' + userId).remove();
              })
              .then(() => {
                // Delete user account
                return user.delete();
              })
              .then(() => {
                showNotification('Akun berhasil dihapus', 'success');
                
                // Clear localStorage
                localStorage.clear();
                
                // Redirect to login page
                window.location.href = 'login.html';
              })
              .catch(error => {
                console.error('Error deleting account:', error);
                
                let errorMessage = 'Gagal menghapus akun.';
                if (error.code === 'auth/wrong-password') {
                  errorMessage = 'Kata sandi salah.';
                }
                
                showNotification(errorMessage, 'error');
                
                confirmDeleteBtn.textContent = originalText;
                confirmDeleteBtn.disabled = false;
              });
          };
        }
        
        // Set up cancel button
        const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
        if (cancelDeleteBtn) {
          cancelDeleteBtn.onclick = function() {
            deleteAccountModal.style.display = 'none';
            document.getElementById('deletePassword').value = '';
          };
        }
      }
    });
  }
  
  // Logout all devices button
  const logoutAllBtn = document.getElementById('logoutAllBtn');
  if (logoutAllBtn) {
    logoutAllBtn.addEventListener('click', function() {
      if (confirm('Apakah Anda yakin ingin keluar dari semua perangkat?')) {
        auth.signOut().then(() => {
          showNotification('Berhasil keluar dari semua perangkat', 'success');
          window.location.href = 'login.html';
        }).catch(error => {
          console.error('Error signing out:', error);
          showNotification('Gagal keluar', 'error');
        });
      }
    });
  }
}

// Search User Page Functions
function initializeSearchUserPage() {
  // Check if user is logged in
  const userId = localStorage.getItem('userId');
  if (!userId) {
    window.location.href = 'login.html';
    return;
  }
  
  // Update sidebar user info
  updateSidebarUserInfo();
  
  // Load conversations
  loadConversations();
  
  // Initialize search
  initializeSearchUser();
  
  // Initialize tabs
  initializeUserTabs();
  
  // Load users
  loadAllUsers();
  loadContacts();
  loadSuggestions();
}

function initializeSearchUser() {
  const searchUserInput = document.getElementById('searchUserInput');
  if (!searchUserInput) return;
  
  searchUserInput.addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    // Filter users based on search term
    document.querySelectorAll('.user-item').forEach(userItem => {
      const userName = userItem.querySelector('.user-name').textContent.toLowerCase();
      const userEmail = userItem.querySelector('.user-email').textContent.toLowerCase();
      
      if (userName.includes(searchTerm) || userEmail.includes(searchTerm)) {
        userItem.style.display = 'flex';
      } else {
        userItem.style.display = 'none';
      }
    });
  });
}

function initializeUserTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const tabId = this.dataset.tab;
      
      // Update active tab button
      tabBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      // Update active tab content
      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === tabId + '-users' || content.id === tabId) {
          content.classList.add('active');
        }
      });
    });
  });
}

function loadAllUsers() {
  const allUsersList = document.getElementById('allUsersList');
  if (!allUsersList) return;
  
  // Clear existing users
  allUsersList.innerHTML = '';
  
  // Get users from database
  database.ref('users').once('value').then(snapshot => {
    users = [];
    const userId = localStorage.getItem('userId');
    
    snapshot.forEach(childSnapshot => {
      const user = childSnapshot.val();
      user.id = childSnapshot.key;
      
      // Skip current user
      if (user.id !== userId) {
        users.push(user);
      }
    });
    
    // Display users
    if (users.length === 0) {
      allUsersList.innerHTML = '<div class="empty-users"><p>Tidak ada pengguna lain</p></div>';
    } else {
      users.forEach(user => {
        const userElement = createUserElement(user);
        allUsersList.appendChild(userElement);
      });
    }
  }).catch(error => {
    console.error('Error loading users:', error);
    allUsersList.innerHTML = '<div class="error"><p>Gagal memuat pengguna</p></div>';
  });
}

function loadContacts() {
  const contactsList = document.getElementById('contactsList');
  if (!contactsList) return;
  
  // Clear existing contacts
  contactsList.innerHTML = '';
  
  // Get conversations (contacts) from database
  const userId = localStorage.getItem('userId');
  database.ref('conversations').orderByChild('participants/' + userId).equalTo(true).once('value').then(snapshot => {
    const contacts = [];
    
    snapshot.forEach(childSnapshot => {
      const conversation = childSnapshot.val();
      
      // Get other participant
      for (const participantId in conversation.participants) {
        if (participantId !== userId) {
          contacts.push(participantId);
          break;
        }
      }
    });
    
    // Get contact details
    if (contacts.length === 0) {
      contactsList.innerHTML = '<div class="empty-contacts"><p>Belum ada kontak</p></div>';
    } else {
      contacts.forEach(contactId => {
        database.ref('users/' + contactId).once('value').then(snapshot => {
          const contact = snapshot.val();
          if (!contact) return;
          
          contact.id = contactId;
          const contactElement = createUserElement(contact);
          contactsList.appendChild(contactElement);
        });
      });
    }
  }).catch(error => {
    console.error('Error loading contacts:', error);
    contactsList.innerHTML = '<div class="error"><p>Gagal memuat kontak</p></div>';
  });
}

function loadSuggestions() {
  const suggestionsList = document.getElementById('suggestionsList');
  if (!suggestionsList) return;
  
  // Clear existing suggestions
  suggestionsList.innerHTML = '';
  
  // Get current user's contacts
  const userId = localStorage.getItem('userId');
  database.ref('conversations').orderByChild('participants/' + userId).equalTo(true).once('value').then(snapshot => {
    const contactIds = [];
    
    snapshot.forEach(childSnapshot => {
      const conversation = childSnapshot.val();
      
      // Get other participant
      for (const participantId in conversation.participants) {
        if (participantId !== userId) {
          contactIds.push(participantId);
          break;
        }
      }
    });
    
    // Get all users
    database.ref('users').once('value').then(snapshot => {
      const suggestions = [];
      
      snapshot.forEach(childSnapshot => {
        const user = childSnapshot.val();
        user.id = childSnapshot.key;
        
        // Skip current user and existing contacts
        if (user.id !== userId && !contactIds.includes(user.id)) {
          suggestions.push(user);
        }
      });
      
      // Display suggestions (limit to 5)
      if (suggestions.length === 0) {
        suggestionsList.innerHTML = '<div class="empty-suggestions"><p>Tidak ada saran pengguna</p></div>';
      } else {
        const limitedSuggestions = suggestions.slice(0, 5);
        limitedSuggestions.forEach(user => {
          const userElement = createUserElement(user);
          suggestionsList.appendChild(userElement);
        });
      }
    });
  }).catch(error => {
    console.error('Error loading suggestions:', error);
    suggestionsList.innerHTML = '<div class="error"><p>Gagal memuat saran</p></div>';
  });
}

function createUserElement(user) {
  const userElement = document.createElement('div');
  userElement.className = 'user-item';
  userElement.dataset.id = user.id;
  
  userElement.innerHTML = `
    <img src="${user.profilePic || 'https://via.placeholder.com/40'}" alt="${user.name}">
    <div class="user-info">
      <h3 class="user-name">${user.name}</h3>
      <p class="user-email">${user.email}</p>
      <p class="user-status">${user.status === 'online' ? 'Online' : 'Offline'}</p>
    </div>
    <div class="user-actions">
      <button class="btn-icon" onclick="viewUserProfile('${user.id}')" title="Lihat Profil">
        <i class="fas fa-user"></i>
      </button>
      <button class="btn-icon" onclick="startChatWithUser('${user.id}')" title="Mulai Chat">
        <i class="fas fa-comment"></i>
      </button>
    </div>
  `;
  
  return userElement;
}

function viewUserProfile(userId) {
  // Get user data
  database.ref('users/' + userId).once('value').then(snapshot => {
    const user = snapshot.val();
    if (!user) return;
    
    const userProfileModal = document.getElementById('userProfileModal');
    const modalUserProfilePic = document.getElementById('modalUserProfilePic');
    const modalUserName = document.getElementById('modalUserName');
    const modalUserEmail = document.getElementById('modalUserEmail');
    const modalUserStatus = document.getElementById('modalUserStatus');
    
    if (!userProfileModal || !modalUserProfilePic || !modalUserName || !modalUserEmail || !modalUserStatus) return;
    
    // Set user data
    modalUserProfilePic.src = user.profilePic || 'https://via.placeholder.com/100';
    modalUserName.textContent = user.name;
    modalUserEmail.textContent = user.email;
    modalUserStatus.textContent = user.userStatus || 'Tidak ada status';
    
    // Show modal
    userProfileModal.style.display = 'flex';
    
    // Set up start chat button
    const startChatBtn = document.getElementById('startChatBtn');
    if (startChatBtn) {
      startChatBtn.onclick = function() {
        startChatWithUser(userId);
        userProfileModal.style.display = 'none';
      };
    }
    
    // Set up close button
    const closeProfileBtn = document.getElementById('closeProfileBtn');
    if (closeProfileBtn) {
      closeProfileBtn.onclick = function() {
        userProfileModal.style.display = 'none';
      };
    }
  });
}

function startChatWithUser(userId) {
  const currentUserId = localStorage.getItem('userId');
  
  // Check if conversation already exists
  database.ref('conversations').once('value').then(snapshot => {
    let existingConversationId = null;
    
    snapshot.forEach(childSnapshot => {
      const conversation = childSnapshot.val();
      
      // Check if conversation includes both users
      if (conversation.participants && 
          conversation.participants[currentUserId] && 
          conversation.participants[userId]) {
        existingConversationId = childSnapshot.key;
      }
    });
    
    if (existingConversationId) {
      // Conversation already exists, open it
      window.location.href = `chat.html?conversation=${existingConversationId}`;
    } else {
      // Create new conversation
      const newConversation = {
        participants: {
          [currentUserId]: true,
          [userId]: true
        },
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        lastMessageTime: firebase.database.ServerValue.TIMESTAMP
      };
      
      database.ref('conversations').push(newConversation).then(ref => {
        const conversationId = ref.key;
        window.location.href = `chat.html?conversation=${conversationId}`;
      }).catch(error => {
        console.error('Error creating conversation:', error);
        showNotification('Gagal membuat percakapan', 'error');
      });
    }
  });
}

// Memory Page Functions
function initializeMemoryPage() {
  // Check if user is logged in
  const userId = localStorage.getItem('userId');
  if (!userId) {
    window.location.href = 'login.html';
    return;
  }
  
  // Update sidebar user info
  updateSidebarUserInfo();
  
  // Load conversations
  loadConversations();
  
  // Initialize memory tabs
  initializeMemoryTabs();
  
  // Load memory data
  loadMemoryData();
  
  // Initialize memory actions
  initializeMemoryActions();
}

function initializeMemoryTabs() {
  const tabBtns = document.querySelectorAll('.memory-tabs .tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const tabId = this.dataset.tab;
      
      // Update active tab button
      tabBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      // Update active tab content
      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === tabId + '-tab') {
          content.classList.add('active');
        }
      });
    });
  });
}

function loadMemoryData() {
  const userId = localStorage.getItem('userId');
  
  // Calculate memory usage
  let totalMemory = 0;
  let messagesMemory = 0;
  let filesMemory = 0;
  let profilePicSize = 0;
  let totalMessages = 0;
  let totalFiles = 0;
  
  // Get user data (for profile picture)
  database.ref('users/' + userId).once('value').then(snapshot => {
    const userData = snapshot.val();
    if (userData && userData.profilePic) {
      // Estimate profile picture size (base64 string length / 1024 / 1024)
      profilePicSize = userData.profilePic.length / 1024 / 1024;
      totalMemory += profilePicSize;
      
      // Update UI
      document.getElementById('profilePicSize').textContent = profilePicSize.toFixed(2);
    }
    
    // Get conversations
    return database.ref('conversations').orderByChild('participants/' + userId).equalTo(true).once('value');
  }).then(snapshot => {
    const conversationIds = [];
    
    snapshot.forEach(childSnapshot => {
      conversationIds.push(childSnapshot.key);
    });
    
    // Get messages for each conversation
    const messagePromises = conversationIds.map(conversationId => {
      return database.ref('messages').orderByChild('conversationId').equalTo(conversationId).once('value');
    });
    
    return Promise.all(messagePromises);
  }).then(results => {
    // Process messages
    results.forEach(snapshot => {
      snapshot.forEach(childSnapshot => {
        const message = childSnapshot.val();
        
        totalMessages++;
        
        if (message.type === 'text') {
          // Estimate text message size
          const messageSize = (message.text || '').length / 1024 / 1024;
          messagesMemory += messageSize;
          totalMemory += messageSize;
        } else if (message.type === 'file') {
          // File message
          totalFiles++;
          const fileSize = (message.fileSize || 0) / 1024 / 1024;
          filesMemory += fileSize;
          totalMemory += fileSize;
          
          // Add to files list
          files.push({
            id: childSnapshot.key,
            fileName: message.fileName,
            fileType: message.fileType,
            fileSize: message.fileSize,
            fileData: message.fileData,
            timestamp: message.timestamp,
            conversationId: message.conversationId
          });
        }
      });
    });
    
    // Update UI
    document.getElementById('usedMemory').textContent = totalMemory.toFixed(2);
    document.getElementById('totalMemory').textContent = '100';
    document.getElementById('memoryPercentage').textContent = ((totalMemory / 100) * 100).toFixed(0);
    document.getElementById('totalMessages').textContent = totalMessages;
    document.getElementById('messagesMemory').textContent = messagesMemory.toFixed(2);
    document.getElementById('totalFiles').textContent = totalFiles;
    document.getElementById('filesMemory').textContent = filesMemory.toFixed(2);
    
    // Update memory progress bar
    const totalMemoryProgress = document.getElementById('totalMemoryProgress');
    if (totalMemoryProgress) {
      totalMemoryProgress.style.width = `${(totalMemory / 100) * 100}%`;
      
      // Change color based on usage
      if (totalMemory > 80) {
        totalMemoryProgress.style.backgroundColor = '#e74c3c'; // Red
      } else if (totalMemory > 60) {
        totalMemoryProgress.style.backgroundColor = '#f39c12'; // Orange
      } else {
        totalMemoryProgress.style.backgroundColor = '#2ecc71'; // Green
      }
    }
    
    // Load files list
    loadFilesList();
    
    // Load messages list
    loadMessagesList();
    
    // Load chats list
    loadChatsList();
  }).catch(error => {
    console.error('Error loading memory data:', error);
    showNotification('Gagal memuat data memori', 'error');
  });
}

function loadFilesList() {
  const filesList = document.getElementById('filesList');
  if (!filesList) return;
  
  // Clear existing files
  filesList.innerHTML = '';
  
  // Sort files by timestamp (newest first)
  files.sort((a, b) => b.timestamp - a.timestamp);
  
  // Display files
  if (files.length === 0) {
    filesList.innerHTML = '<div class="empty-files"><p>Belum ada file</p></div>';
  } else {
    files.forEach(file => {
      const fileElement = createFileElement(file);
      filesList.appendChild(fileElement);
    });
  }
}

function createFileElement(file) {
  const fileElement = document.createElement('div');
  fileElement.className = 'file-item';
  fileElement.dataset.id = file.id;
  
  const fileIcon = getFileIcon(file.fileType);
  const fileSize = formatFileSize(file.fileSize);
  const formattedTime = formatTime(file.timestamp);
  
  fileElement.innerHTML = `
    <div class="file-icon">
      <i class="${fileIcon}"></i>
    </div>
    <div class="file-info">
      <h4>${file.fileName}</h4>
      <p>${fileSize} • ${formattedTime}</p>
    </div>
    <div class="file-actions">
      <button class="btn-icon" onclick="previewMemoryFile('${file.id}')" title="Pratinjau">
        <i class="fas fa-eye"></i>
      </button>
      <button class="btn-icon" onclick="downloadMemoryFile('${file.id}')" title="Download">
        <i class="fas fa-download"></i>
      </button>
      <button class="btn-icon" onclick="deleteMemoryFile('${file.id}')" title="Hapus">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `;
  
  return fileElement;
}

function loadMessagesList() {
  const messagesList = document.getElementById('messagesList');
  if (!messagesList) return;
  
  // Clear existing messages
  messagesList.innerHTML = '';
  
  // Get all messages for the user
  const userId = localStorage.getItem('userId');
  
  database.ref('conversations').orderByChild('participants/' + userId).equalTo(true).once('value').then(snapshot => {
    const conversationIds = [];
    
    snapshot.forEach(childSnapshot => {
      conversationIds.push(childSnapshot.key);
    });
    
    // Get messages for each conversation
    const messagePromises = conversationIds.map(conversationId => {
      return database.ref('messages').orderByChild('conversationId').equalTo(conversationId).once('value');
    });
    
    return Promise.all(messagePromises);
  }).then(results => {
    const allMessages = [];
    
    // Process messages
    results.forEach((snapshot, index) => {
      const conversationId = snapshot.ref.parent.key;
      
      snapshot.forEach(childSnapshot => {
        const message = childSnapshot.val();
        message.id = childSnapshot.key;
        message.conversationId = conversationId;
        
        if (message.type === 'text') {
          allMessages.push(message);
        }
      });
    });
    
    // Sort messages by timestamp (newest first)
    allMessages.sort((a, b) => b.timestamp - a.timestamp);
    
    // Display messages
    if (allMessages.length === 0) {
      messagesList.innerHTML = '<div class="empty-messages"><p>Belum ada pesan</p></div>';
    } else {
      allMessages.forEach(message => {
        const messageElement = createMessageMemoryElement(message);
        messagesList.appendChild(messageElement);
      });
    }
  }).catch(error => {
    console.error('Error loading messages:', error);
    messagesList.innerHTML = '<div class="error"><p>Gagal memuat pesan</p></div>';
  });
}

function createMessageMemoryElement(message) {
  const messageElement = document.createElement('div');
  messageElement.className = 'message-item';
  messageElement.dataset.id = message.id;
  
  const formattedTime = formatTime(message.timestamp);
  const userId = localStorage.getItem('userId');
  const isOwnMessage = message.senderId === userId;
  
  // Get sender info
  database.ref('users/' + message.senderId).once('value').then(snapshot => {
    const sender = snapshot.val();
    if (!sender) return;
    
    messageElement.innerHTML = `
      <div class="message-header">
        <img src="${sender.profilePic || 'https://via.placeholder.com/30'}" alt="${sender.name}">
        <div class="message-sender">
          <h4>${sender.name}</h4>
          <p>${formattedTime}</p>
        </div>
        ${isOwnMessage ? `
          <div class="message-actions">
            <button class="btn-icon" onclick="deleteMemoryMessage('${message.id}')" title="Hapus">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        ` : ''}
      </div>
      <div class="message-content">${message.text}</div>
    `;
  });
  
  return messageElement;
}

function loadChatsList() {
  const chatsList = document.getElementById('chatsList');
  if (!chatsList) return;
  
  // Clear existing chats
  chatsList.innerHTML = '';
  
  // Get conversations for the user
  const userId = localStorage.getItem('userId');
  
  database.ref('conversations').orderByChild('participants/' + userId).equalTo(true).once('value').then(snapshot => {
    const allChats = [];
    
    snapshot.forEach(childSnapshot => {
      const chat = childSnapshot.val();
      chat.id = childSnapshot.key;
      allChats.push(chat);
    });
    
    // Sort chats by last message time (newest first)
    allChats.sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));
    
    // Display chats
    if (allChats.length === 0) {
      chatsList.innerHTML = '<div class="empty-chats"><p>Belum ada percakapan</p></div>';
    } else {
      allChats.forEach(chat => {
        const chatElement = createChatElement(chat);
        chatsList.appendChild(chatElement);
      });
    }
  }).catch(error => {
    console.error('Error loading chats:', error);
    chatsList.innerHTML = '<div class="error"><p>Gagal memuat percakapan</p></div>';
  });
}

function createChatElement(chat) {
  const chatElement = document.createElement('div');
  chatElement.className = 'chat-item';
  chatElement.dataset.id = chat.id;
  
  const lastMessageTime = chat.lastMessageTime ? formatTime(chat.lastMessageTime) : '';
  
  // Get other participant
  const userId = localStorage.getItem('userId');
  let otherUserId = null;
  
  for (const participantId in chat.participants) {
    if (participantId !== userId) {
      otherUserId = participantId;
      break;
    }
  }
  
  if (!otherUserId) return chatElement;
  
  // Get other user info
  database.ref('users/' + otherUserId).once('value').then(snapshot => {
    const otherUser = snapshot.val();
    if (!otherUser) return;
    
    chatElement.innerHTML = `
      <img src="${otherUser.profilePic || 'https://via.placeholder.com/40'}" alt="${otherUser.name}">
      <div class="chat-info">
        <h3>${otherUser.name}</h3>
        <p>${chat.lastMessage || 'Belum ada pesan'}</p>
      </div>
      <div class="chat-meta">
        <span class="time">${lastMessageTime}</span>
      </div>
      <div class="chat-actions">
        <button class="btn-icon" onclick="openChat('${chat.id}')" title="Buka">
          <i class="fas fa-comment"></i>
        </button>
        <button class="btn-icon" onclick="deleteChat('${chat.id}')" title="Hapus">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
  });
  
  return chatElement;
}

function initializeMemoryActions() {
  // Delete large files button
  const deleteLargeFilesBtn = document.getElementById('deleteLargeFilesBtn');
  if (deleteLargeFilesBtn) {
    deleteLargeFilesBtn.addEventListener('click', function() {
      if (confirm('Apakah Anda yakin ingin menghapus semua file yang lebih besar dari 10MB?')) {
        // Find files larger than 10MB
        const largeFiles = files.filter(file => file.fileSize > 10 * 1024 * 1024);
        
        if (largeFiles.length === 0) {
          showNotification('Tidak ada file yang lebih besar dari 10MB', 'info');
          return;
        }
        
        // Delete each file
        let deletedCount = 0;
        largeFiles.forEach(file => {
          database.ref('messages/' + file.id).remove()
            .then(() => {
              deletedCount++;
              
              if (deletedCount === largeFiles.length) {
                showNotification(`Berhasil menghapus ${deletedCount} file`, 'success');
                
                // Reload memory data
                files = files.filter(f => f.fileSize <= 10 * 1024 * 1024);
                loadMemoryData();
              }
            })
            .catch(error => {
              console.error('Error deleting file:', error);
            });
        });
      }
    });
  }
  
  // Clean old chats button
  const cleanOldChatsBtn = document.getElementById('cleanOldChatsBtn');
  if (cleanOldChatsBtn) {
    cleanOldChatsBtn.addEventListener('click', function() {
      if (confirm('Apakah Anda yakin ingin menghapus percakapan yang tidak aktif selama 6 bulan?')) {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const sixMonthsAgoTimestamp = sixMonthsAgo.getTime();
        
        // Get conversations for the user
        const userId = localStorage.getItem('userId');
        
        database.ref('conversations').orderByChild('participants/' + userId).equalTo(true).once('value').then(snapshot => {
          const oldChats = [];
          
          snapshot.forEach(childSnapshot => {
            const chat = childSnapshot.val();
            chat.id = childSnapshot.key;
            
            // Check if chat is older than 6 months
            if (chat.lastMessageTime && chat.lastMessageTime < sixMonthsAgoTimestamp) {
              oldChats.push(chat);
            }
          });
          
          if (oldChats.length === 0) {
            showNotification('Tidak ada percakapan yang lebih lama dari 6 bulan', 'info');
            return;
          }
          
          // Delete each old chat and its messages
          let deletedCount = 0;
          oldChats.forEach(chat => {
            // Delete messages
            database.ref('messages').orderByChild('conversationId').equalTo(chat.id).once('value').then(messagesSnapshot => {
              const messageDeletePromises = [];
              
              messagesSnapshot.forEach(messageSnapshot => {
                messageDeletePromises.push(
                  database.ref('messages/' + messageSnapshot.key).remove()
                );
              });
              
              return Promise.all(messageDeletePromises);
            }).then(() => {
              // Delete conversation
              return database.ref('conversations/' + chat.id).remove();
            }).then(() => {
              deletedCount++;
              
              if (deletedCount === oldChats.length) {
                showNotification(`Berhasil membersihkan ${deletedCount} percakapan lama`, 'success');
                
                // Reload memory data
                loadMemoryData();
              }
            }).catch(error => {
              console.error('Error cleaning old chat:', error);
            });
          });
        }).catch(error => {
          console.error('Error loading old chats:', error);
          showNotification('Gagal memuat percakapan lama', 'error');
        });
      }
    });
  }
  
  // Compress media button
  const compressMediaBtn = document.getElementById('compressMediaBtn');
  if (compressMediaBtn) {
    compressMediaBtn.addEventListener('click', function() {
      showNotification('Fitur kompresi media akan segera hadir', 'info');
    });
  }
}

function previewMemoryFile(fileId) {
  const file = files.find(f => f.id === fileId);
  if (!file) return;
  
  const filePreviewModal = document.getElementById('filePreviewModal');
  const filePreview = document.getElementById('filePreview');
  const fileName = document.getElementById('fileName');
  const fileSize = document.getElementById('fileSize');
  const fileDate = document.getElementById('fileDate');
  const fileChat = document.getElementById('fileChat');
  
  if (!filePreviewModal || !filePreview || !fileName || !fileSize || !fileDate || !fileChat) return;
  
  // Display file info
  fileName.textContent = file.fileName;
  fileSize.textContent = formatFileSize(file.fileSize);
  fileDate.textContent = formatTime(file.timestamp);
  
  // Get chat info
  database.ref('conversations/' + file.conversationId).once('value').then(snapshot => {
    const chat = snapshot.val();
    if (!chat) return;
    
    // Get other participant
    const userId = localStorage.getItem('userId');
    let otherUserId = null;
    
    for (const participantId in chat.participants) {
      if (participantId !== userId) {
        otherUserId = participantId;
        break;
      }
    }
    
    if (!otherUserId) return;
    
    // Get other user info
    database.ref('users/' + otherUserId).once('value').then(snapshot => {
      const otherUser = snapshot.val();
      if (!otherUser) return;
      
      fileChat.textContent = `Percakapan dengan ${otherUser.name}`;
    });
  });
  
  // Preview file based on type
  if (file.fileType.startsWith('image/')) {
    // Convert base64 to data URL
    const dataUrl = `data:${file.fileType};base64,${file.fileData}`;
    filePreview.innerHTML = `<img src="${dataUrl}" alt="${file.fileName}">`;
  } else if (file.fileType === 'application/pdf') {
    filePreview.innerHTML = `<div class="file-preview-placeholder"><i class="fas fa-file-pdf"></i></div>`;
  } else if (file.fileType.includes('text/')) {
    // Convert base64 to text
    const text = atob(file.fileData);
    filePreview.innerHTML = `<div class="text-preview">${text}</div>`;
  } else {
    filePreview.innerHTML = `<div class="file-preview-placeholder"><i class="fas fa-file"></i></div>`;
  }
  
  // Show modal
  filePreviewModal.style.display = 'flex';
  
  // Set up close button
  const closePreviewBtn = document.getElementById('closePreviewBtn');
  if (closePreviewBtn) {
    closePreviewBtn.onclick = function() {
      filePreviewModal.style.display = 'none';
    };
  }
  
  // Set up delete button
  const deleteFileBtn = document.getElementById('deleteFileBtn');
  if (deleteFileBtn) {
    deleteFileBtn.onclick = function() {
      deleteMemoryFile(fileId);
      filePreviewModal.style.display = 'none';
    };
  }
}

function downloadMemoryFile(fileId) {
  const file = files.find(f => f.id === fileId);
  if (!file) return;
  
  // Convert base64 to blob
  const byteCharacters = atob(file.fileData);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: file.fileType });
  
  // Create download link
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.fileName;
  document.body.appendChild(a);
  a.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

function deleteMemoryFile(fileId) {
  if (confirm('Apakah Anda yakin ingin menghapus file ini?')) {
    // Delete file from database
    database.ref('messages/' + fileId).remove()
      .then(() => {
        showNotification('File berhasil dihapus', 'success');
        
        // Remove from files array
        files = files.filter(f => f.id !== fileId);
        
        // Reload memory data
        loadMemoryData();
      })
      .catch(error => {
        console.error('Error deleting file:', error);
        showNotification('Gagal menghapus file', 'error');
      });
  }
}

function deleteMemoryMessage(messageId) {
  if (confirm('Apakah Anda yakin ingin menghapus pesan ini?')) {
    // Delete message from database
    database.ref('messages/' + messageId).remove()
      .then(() => {
        showNotification('Pesan berhasil dihapus', 'success');
        
        // Reload memory data
        loadMemoryData();
      })
      .catch(error => {
        console.error('Error deleting message:', error);
        showNotification('Gagal menghapus pesan', 'error');
      });
  }
}

function deleteChat(chatId) {
  if (confirm('Apakah Anda yakin ingin menghapus percakapan ini?')) {
    // Delete messages
    database.ref('messages').orderByChild('conversationId').equalTo(chatId).once('value').then(snapshot => {
      const messageDeletePromises = [];
      
      snapshot.forEach(messageSnapshot => {
        messageDeletePromises.push(
          database.ref('messages/' + messageSnapshot.key).remove()
        );
      });
      
      return Promise.all(messageDeletePromises);
    }).then(() => {
      // Delete conversation
      return database.ref('conversations/' + chatId).remove();
    }).then(() => {
      showNotification('Percakapan berhasil dihapus', 'success');
      
      // Reload memory data
      loadMemoryData();
    }).catch(error => {
      console.error('Error deleting chat:', error);
      showNotification('Gagal menghapus percakapan', 'error');
    });
  }
}

function openChat(chatId) {
  window.location.href = `chat.html?conversation=${chatId}`;
}

// ====== CALL FUNCTIONALITY ======
function initializeCallFunctionality() {
  const voiceCallBtn = document.getElementById('voiceCallBtn');
  const videoCallBtn = document.getElementById('videoCallBtn');
  
  if (voiceCallBtn) {
    voiceCallBtn.addEventListener('click', () => {
      startCall('voice');
    });
  }
  
  if (videoCallBtn) {
    videoCallBtn.addEventListener('click', () => {
      startCall('video');
    });
  }
  
  // Listen for incoming calls
  listenForIncomingCalls();
}

function startCall(callType) {
  if (!currentChatId) {
    showNotification('Pilih percakapan terlebih dahulu', 'error');
    return;
  }
  
  // Get other participant
  const userId = localStorage.getItem('userId');
  let otherUserId = null;
  
  for (const participantId in conversations.find(c => c.id === currentChatId)?.participants) {
    if (participantId !== userId) {
      otherUserId = participantId;
      break;
    }
  }
  
  if (!otherUserId) {
    showNotification('Gagal menemukan penerima panggilan', 'error');
    return;
  }
  
  // Get other user info
  database.ref('users/' + otherUserId).once('value').then(snapshot => {
    const otherUser = snapshot.val();
    if (!otherUser) return;
    
    // Create call data
    const callData = {
      callerId: userId,
      receiverId: otherUserId,
      callerName: localStorage.getItem('userName'),
      callerProfilePic: localStorage.getItem('userProfilePic'),
      receiverName: otherUser.name,
      receiverProfilePic: otherUser.profilePic,
      type: callType,
      status: 'calling',
      timestamp: firebase.database.ServerValue.TIMESTAMP
    };
    
    // Save call to database
    database.ref('calls').push(callData).then(ref => {
      const callId = ref.key;
      
      // Redirect to call page
      window.location.href = `call.html?callId=${callId}&type=${callType}&role=caller`;
    }).catch(error => {
      console.error('Error creating call:', error);
      showNotification('Gagal memulai panggilan', 'error');
    });
  });
}

function listenForIncomingCalls() {
  const userId = localStorage.getItem('userId');
  
  database.ref('calls').orderByChild('receiverId').equalTo(userId).on('child_added', snapshot => {
    const call = snapshot.val();
    call.id = snapshot.key;
    
    // Check if call is for current user and status is 'calling'
    if (call.receiverId === userId && call.status === 'calling') {
      showIncomingCallNotification(call);
    }
  });
}

function showIncomingCallNotification(call) {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'call-notification';
  notification.id = `call-notification-${call.id}`;
  
  notification.innerHTML = `
    <img src="${call.callerProfilePic || 'https://via.placeholder.com/50'}" alt="${call.callerName}">
    <div class="call-notification-info">
      <h4>${call.callerName}</h4>
      <p>Panggilan ${call.type === 'video' ? 'video' : 'suara'} masuk...</p>
    </div>
    <div class="call-notification-actions">
      <button class="btn-icon btn-success" onclick="acceptCall('${call.id}', '${call.type}')">
        <i class="fas fa-phone"></i>
      </button>
      <button class="btn-icon btn-danger" onclick="rejectCall('${call.id}')">
        <i class="fas fa-phone-slash"></i>
      </button>
    </div>
  `;
  
  // Add to body
  document.body.appendChild(notification);
  
  // Auto reject after 30 seconds
  setTimeout(() => {
    if (document.getElementById(`call-notification-${call.id}`)) {
      rejectCall(call.id);
    }
  }, 30000);
}

function acceptCall(callId, callType) {
  // Remove notification
  const notification = document.getElementById(`call-notification-${callId}`);
  if (notification) {
    notification.remove();
  }
  
  // Update call status
  database.ref('calls/' + callId).update({
    status: 'accepted'
  }).then(() => {
    // Redirect to call page
    window.location.href = `call.html?callId=${callId}&type=${callType}&role=receiver`;
  }).catch(error => {
    console.error('Error accepting call:', error);
    showNotification('Gagal menerima panggilan', 'error');
  });
}

function rejectCall(callId) {
  // Remove notification
  const notification = document.getElementById(`call-notification-${callId}`);
  if (notification) {
    notification.remove();
  }
  
  // Update call status
  database.ref('calls/' + callId).update({
    status: 'rejected'
  }).catch(error => {
    console.error('Error rejecting call:', error);
  });
}

// Initialize call page
function initializeCallPage() {
  // Check if user is logged in
  const userId = localStorage.getItem('userId');
  if (!userId) {
    window.location.href = 'login.html';
    return;
  }
  
  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const callId = urlParams.get('callId');
  const callType = urlParams.get('type');
  const role = urlParams.get('role');
  
  if (!callId || !callType || !role) {
    window.location.href = 'chat.html';
    return;
  }
  
  // Get call data
  database.ref('calls/' + callId).once('value').then(snapshot => {
    currentCall = snapshot.val();
    currentCall.id = callId;
    
    if (!currentCall) {
      window.location.href = 'chat.html';
      return;
    }
    
    // Set caller/receiver info
    const callerName = document.getElementById('callerName');
    const callerProfilePic = document.getElementById('callerProfilePic');
    const incomingCallerName = document.getElementById('incomingCallerName');
    const incomingCallerProfilePic = document.getElementById('incomingCallerProfilePic');
    const incomingCallType = document.getElementById('incomingCallType');
    const callStatus = document.getElementById('callStatus');
    
    if (role === 'caller') {
      // Set caller info (current user)
      if (callerName) callerName.textContent = currentCall.receiverName;
      if (callerProfilePic) callerProfilePic.src = currentCall.receiverProfilePic || 'https://via.placeholder.com/50';
      if (callStatus) callStatus.textContent = 'Memanggil...';
      
      // Start call
      setupCall(callType, true);
    } else {
      // Show incoming call modal
      const incomingCallModal = document.getElementById('incomingCallModal');
      if (incomingCallModal) {
        if (incomingCallerName) incomingCallerName.textContent = currentCall.callerName;
        if (incomingCallerProfilePic) incomingCallerProfilePic.src = currentCall.callerProfilePic || 'https://via.placeholder.com/100';
        if (incomingCallType) incomingCallType.textContent = `Panggilan ${callType === 'video' ? 'Video' : 'Suara'} Masuk...`;
        
        incomingCallModal.style.display = 'flex';
        
        // Set up accept button
        const acceptCallBtn = document.getElementById('acceptCallBtn');
        if (acceptCallBtn) {
          acceptCallBtn.onclick = function() {
            incomingCallModal.style.display = 'none';
            setupCall(callType, false);
          };
        }
        
        // Set up reject button
        const rejectCallBtn = document.getElementById('rejectCallBtn');
        if (rejectCallBtn) {
          rejectCallBtn.onclick = function() {
            incomingCallModal.style.display = 'none';
            endCall();
            window.location.href = 'chat.html';
          };
        }
      }
    }
    
    // Set up call controls
    setupCallControls();
    
    // Listen for call status changes
    database.ref('calls/' + callId).on('value', snapshot => {
      const call = snapshot.val();
      if (!call) return;
      
      // Update call status
      if (callStatus) {
        if (call.status === 'rejected') {
          callStatus.textContent = 'Panggilan ditolak';
          setTimeout(() => {
            endCall();
            window.location.href = 'chat.html';
          }, 2000);
        } else if (call.status === 'ended') {
          callStatus.textContent = 'Panggilan berakhir';
          setTimeout(() => {
            endCall();
            window.location.href = 'chat.html';
          }, 2000);
        } else if (call.status === 'accepted' && role === 'caller') {
          callStatus.textContent = 'Terhubung';
          startCallTimer();
        }
      }
    });
  }).catch(error => {
    console.error('Error loading call data:', error);
    window.location.href = 'chat.html';
  });
}

function setupCall(callType, isCaller) {
  isCallActive = true;
  
  // Get media devices
  const constraints = {
    audio: true,
    video: callType === 'video'
  };
  
  navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
      localStream = stream;
      
      // Display local video
      const localVideo = document.getElementById('localVideo');
      if (localVideo) {
        localVideo.srcObject = stream;
      }
      
      // Create peer connection
      peerConnection = new RTCPeerConnection(rtcConfiguration);
      
      // Add local stream to peer connection
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
      
      // Listen for remote stream
      peerConnection.ontrack = event => {
        remoteStream = event.streams[0];
        
        // Display remote video
        const remoteVideo = document.getElementById('remoteVideo');
        if (remoteVideo) {
          remoteVideo.srcObject = remoteStream;
        }
      };
      
      // Listen for ICE candidates
      peerConnection.onicecandidate = event => {
        if (event.candidate) {
          // Send ICE candidate to other peer
          const userId = localStorage.getItem('userId');
          const otherUserId = isCaller ? currentCall.receiverId : currentCall.callerId;
          
          database.ref('calls/' + currentCall.id + '/candidates/' + otherUserId).push({
            candidate: event.candidate.toJSON(),
            timestamp: firebase.database.ServerValue.TIMESTAMP
          });
        }
      };
      
      // Listen for connection state changes
      peerConnection.onconnectionstatechange = event => {
        if (peerConnection.connectionState === 'connected') {
          const callStatus = document.getElementById('callStatus');
          if (callStatus) callStatus.textContent = 'Terhubung';
          
          if (!isCaller) {
            startCallTimer();
          }
        } else if (peerConnection.connectionState === 'disconnected' || 
                   peerConnection.connectionState === 'failed' || 
                   peerConnection.connectionState === 'closed') {
          endCall();
        }
      };
      
      if (isCaller) {
        // Create offer
        peerConnection.createOffer()
          .then(offer => {
            return peerConnection.setLocalDescription(offer);
          })
          .then(() => {
            // Send offer to receiver
            database.ref('calls/' + currentCall.id).update({
              offer: peerConnection.localDescription.toJSON()
            });
          })
          .catch(error => {
            console.error('Error creating offer:', error);
            showNotification('Gagal memulai panggilan', 'error');
          });
      } else {
        // Listen for offer
        database.ref('calls/' + currentCall.id).on('value', snapshot => {
          const call = snapshot.val();
          if (!call || !call.offer) return;
          
          // Set remote description
          peerConnection.setRemoteDescription(new RTCSessionDescription(call.offer))
            .then(() => {
              // Create answer
              return peerConnection.createAnswer();
            })
            .then(answer => {
              return peerConnection.setLocalDescription(answer);
            })
            .then(() => {
              // Send answer to caller
              database.ref('calls/' + currentCall.id).update({
                answer: peerConnection.localDescription.toJSON(),
                status: 'accepted'
              });
            })
            .catch(error => {
              console.error('Error creating answer:', error);
              showNotification('Gagal menerima panggilan', 'error');
            });
        });
      }
      
      // Listen for ICE candidates
      const userId = localStorage.getItem('userId');
      const otherUserId = isCaller ? currentCall.receiverId : currentCall.callerId;
      
      database.ref('calls/' + currentCall.id + '/candidates/' + userId).on('child_added', snapshot => {
        const candidateData = snapshot.val();
        
        // Add ICE candidate
        peerConnection.addIceCandidate(new RTCIceCandidate(candidateData.candidate))
          .catch(error => {
            console.error('Error adding ICE candidate:', error);
          });
      });
      
      // Listen for answer (if caller)
      if (isCaller) {
        database.ref('calls/' + currentCall.id).on('value', snapshot => {
          const call = snapshot.val();
          if (!call || !call.answer) return;
          
          // Set remote description
          peerConnection.setRemoteDescription(new RTCSessionDescription(call.answer))
            .catch(error => {
              console.error('Error setting remote description:', error);
            });
        });
      }
    })
    .catch(error => {
      console.error('Error accessing media devices:', error);
      showNotification('Gagal mengakses kamera/mikrofon', 'error');
      endCall();
    });
}

function setupCallControls() {
  const muteBtn = document.getElementById('muteBtn');
  const videoToggleBtn = document.getElementById('videoToggleBtn');
  const endCallBtn = document.getElementById('endCallBtn');
  const screenShareBtn = document.getElementById('screenShareBtn');
  
  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = !audioTrack.enabled;
          muteBtn.classList.toggle('active', !audioTrack.enabled);
        }
      }
    });
  }
  
  if (videoToggleBtn) {
    videoToggleBtn.addEventListener('click', () => {
      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.enabled = !videoTrack.enabled;
          videoToggleBtn.classList.toggle('active', !videoTrack.enabled);
        }
      }
    });
  }
  
  if (endCallBtn) {
    endCallBtn.addEventListener('click', () => {
      endCall();
      window.location.href = 'chat.html';
    });
  }
  
  if (screenShareBtn) {
    screenShareBtn.addEventListener('click', () => {
      if (localStream) {
        // Check if already sharing screen
        const screenTrack = localStream.getVideoTracks().find(track => track.label.includes('screen'));
        
        if (screenTrack) {
          // Stop screen sharing
          screenTrack.stop();
          
          // Get camera again
          navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
              const videoTrack = stream.getVideoTracks()[0];
              
              // Replace track
              const sender = peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
              if (sender) {
                sender.replaceTrack(videoTrack);
              }
              
              // Update local video
              const localVideo = document.getElementById('localVideo');
              if (localVideo) {
                localVideo.srcObject = stream;
              }
              
              localStream = stream;
              screenShareBtn.classList.remove('active');
            })
            .catch(error => {
              console.error('Error getting camera:', error);
            });
        } else {
          // Start screen sharing
          navigator.mediaDevices.getDisplayMedia({ video: true })
            .then(stream => {
              const screenTrack = stream.getVideoTracks()[0];
              
              // Replace track
              const sender = peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
              if (sender) {
                sender.replaceTrack(screenTrack);
              }
              
              // Update local video
              const localVideo = document.getElementById('localVideo');
              if (localVideo) {
                localVideo.srcObject = stream;
              }
              
              // Listen for screen share end
              screenTrack.onended = () => {
                // Get camera again
                navigator.mediaDevices.getUserMedia({ video: true })
                  .then(stream => {
                    const videoTrack = stream.getVideoTracks()[0];
                    
                    // Replace track
                    const sender = peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
                    if (sender) {
                      sender.replaceTrack(videoTrack);
                    }
                    
                    // Update local video
                    const localVideo = document.getElementById('localVideo');
                    if (localVideo) {
                      localVideo.srcObject = stream;
                    }
                    
                    localStream = stream;
                    screenShareBtn.classList.remove('active');
                  })
                  .catch(error => {
                    console.error('Error getting camera:', error);
                  });
              };
              
              localStream = stream;
              screenShareBtn.classList.add('active');
            })
            .catch(error => {
              console.error('Error starting screen share:', error);
              showNotification('Gagal membagikan layar', 'error');
            });
        }
      }
    });
  }
}

function startCallTimer() {
  callSeconds = 0;
  updateCallTimer();
  
  callTimer = setInterval(() => {
    callSeconds++;
    updateCallTimer();
  }, 1000);
}

function updateCallTimer() {
  const minutes = Math.floor(callSeconds / 60);
  const seconds = callSeconds % 60;
  
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  const callTime = document.getElementById('callTime');
  if (callTime) {
    callTime.textContent = formattedTime;
  }
}

function endCall() {
  isCallActive = false;
  
  // Clear call timer
  if (callTimer) {
    clearInterval(callTimer);
    callTimer = null;
  }
  
  // Update call status
  if (currentCall) {
    database.ref('calls/' + currentCall.id).update({
      status: 'ended',
      endTime: firebase.database.ServerValue.TIMESTAMP
    }).catch(error => {
      console.error('Error updating call status:', error);
    });
  }
  
  // Close peer connection
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
  
  // Stop local stream
  if (localStream) {
    localStream.getTracks().forEach(track => {
      track.stop();
    });
    localStream = null;
  }
  
  // Stop remote stream
  if (remoteStream) {
    remoteStream.getTracks().forEach(track => {
      track.stop();
    });
    remoteStream = null;
  }
}

// Handle page unload
window.addEventListener('beforeunload', () => {
  if (isCallActive) {
    endCall();
  }
});

// Utility Functions
function initializeModals() {
  // Close modal when clicking on close button
  document.querySelectorAll('.close-modal').forEach(closeBtn => {
    closeBtn.addEventListener('click', function() {
      const modal = this.closest('.modal');
      if (modal) {
        modal.style.display = 'none';
      }
    });
  });
  
  // Close modal when clicking outside of modal content
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
      if (e.target === this) {
        this.style.display = 'none';
      }
    });
  });
  
  // Cancel file button
  const cancelFileBtn = document.getElementById('cancelFileBtn');
  if (cancelFileBtn) {
    cancelFileBtn.addEventListener('click', function() {
      const filePreviewModal = document.getElementById('filePreviewModal');
      if (filePreviewModal) {
        filePreviewModal.style.display = 'none';
        selectedFile = null;
      }
    });
  }
  
  // Cancel edit button
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', function() {
      const editMessageModal = document.getElementById('editMessageModal');
      if (editMessageModal) {
        editMessageModal.style.display = 'none';
        editingMessageId = null;
      }
    });
  }
}

function initializeTabs() {
  // Tabs are already initialized in specific page functions
}

function togglePassword(inputId) {
  const passwordInput = document.getElementById(inputId);
  const toggleIcon = passwordInput.nextElementSibling;
  
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    toggleIcon.classList.remove('fa-eye');
    toggleIcon.classList.add('fa-eye-slash');
  } else {
    passwordInput.type = 'password';
    toggleIcon.classList.remove('fa-eye-slash');
    toggleIcon.classList.add('fa-eye');
  }
}

function formatTime(timestamp) {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  
  // If today, show time
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }
  
  // If yesterday, show "Yesterday"
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Kemarin';
  }
  
  // If within a week, show day name
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  if (date > oneWeekAgo) {
    return date.toLocaleDateString('id-ID', { weekday: 'long' });
  }
  
  // Otherwise, show date
  return date.toLocaleDateString('id-ID');
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileIcon(fileType) {
  if (fileType.startsWith('image/')) {
    return 'fas fa-image';
  } else if (fileType === 'application/pdf') {
    return 'fas fa-file-pdf';
  } else if (fileType.includes('word')) {
    return 'fas fa-file-word';
  } else if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
    return 'fas fa-file-excel';
  } else if (fileType.includes('powerpoint') || fileType.includes('presentation')) {
    return 'fas fa-file-powerpoint';
  } else if (fileType.startsWith('audio/')) {
    return 'fas fa-file-audio';
  } else if (fileType.startsWith('video/')) {
    return 'fas fa-file-video';
  } else if (fileType.includes('text/')) {
    return 'fas fa-file-alt';
  } else if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('tar') || fileType.includes('7z')) {
    return 'fas fa-file-archive';
  } else {
    return 'fas fa-file';
  }
}

function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  
  // Set icon based on type
  let icon = 'fas fa-info-circle';
  if (type === 'success') {
    icon = 'fas fa-check-circle';
  } else if (type === 'error') {
    icon = 'fas fa-exclamation-circle';
  } else if (type === 'warning') {
    icon = 'fas fa-exclamation-triangle';
  }
  
  notification.innerHTML = `
    <div class="notification-content">
      <i class="${icon}"></i>
      <span>${message}</span>
    </div>
    <button class="notification-close">&times;</button>
  `;
  
  // Add to body
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // Set up close button
  const closeBtn = notification.querySelector('.notification-close');
  closeBtn.addEventListener('click', () => {
    notification.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  });
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification);
        }
      }, 300);
    }
  }, 5000);
}

function logout() {
  if (confirm('Apakah Anda yakin ingin keluar?')) {
    auth.signOut().then(() => {
      showNotification('Berhasil keluar', 'success');
      window.location.href = 'login.html';
    }).catch(error => {
      console.error('Error signing out:', error);
      showNotification('Gagal keluar', 'error');
    });
  }
}

// Check for conversation ID in URL
window.addEventListener('load', function() {
  const urlParams = new URLSearchParams(window.location.search);
  const conversationId = urlParams.get('conversation');
  
  if (conversationId && window.location.pathname.includes('chat.html')) {
    // Wait for DOM to be fully loaded
    setTimeout(() => {
      // Get conversation data
      database.ref('conversations/' + conversationId).once('value').then(snapshot => {
        const conversation = snapshot.val();
        if (!conversation) return;
        
        // Get other participant
        const userId = localStorage.getItem('userId');
        let otherUserId = null;
        
        for (const participantId in conversation.participants) {
          if (participantId !== userId) {
            otherUserId = participantId;
            break;
          }
        }
        
        if (!otherUserId) return;
        
        // Get other user info
        database.ref('users/' + otherUserId).once('value').then(snapshot => {
          const otherUser = snapshot.val();
          if (!otherUser) return;
          
          // Open conversation
          openConversation(conversationId, otherUser);
        });
      });
    }, 500);
  }
});