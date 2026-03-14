const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

export async function signup(userData) {
  const r = await fetch(BASE + '/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  })
  if (!r.ok) {
    const error = await r.json()
    throw new Error(error.message || 'Signup failed')
  }
  const data = await r.json()
  localStorage.setItem('token', data.token)
  localStorage.setItem('user', JSON.stringify(data.user))
  return data
}

export async function signin(credentials) {
  const r = await fetch(BASE + '/api/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  })
  if (!r.ok) {
    const error = await r.json()
    throw new Error(error.message || 'Signin failed')
  }
  const data = await r.json()
  localStorage.setItem('token', data.token)
  localStorage.setItem('user', JSON.stringify(data.user))
  return data
}

export function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export function getToken() {
  return localStorage.getItem('token')
}

export function getUser() {
  const user = localStorage.getItem('user')
  try {
    return user ? JSON.parse(user) : null
  } catch (e) {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    return null
  }
}

export function isAuthenticated() {
  return !!getToken()
}

export function getAuthHeader() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// Singleton to hold the client instance
let tokenClient;
let currentResolve;
let currentReject;

export function prepareGoogleLogin() {
  const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'CUSTOM_CLIENT_ID_NEEDED'
  if (CLIENT_ID === 'CUSTOM_CLIENT_ID_NEEDED') return;
  if (typeof google === 'undefined') return;

  if (!tokenClient) {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: 'email profile openid',
      callback: async (tokenResponse) => {
        if (tokenResponse && tokenResponse.access_token) {
          try {
            // Fetch user info from Google
            const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            })
            const userInfo = await userInfoRes.json()

            // Send to backend
            const r = await fetch(BASE + '/api/auth/google', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: userInfo.email,
                name: userInfo.name,
                googleId: userInfo.sub,
                picture: userInfo.picture
              })
            })

            if (!r.ok) {
              const error = await r.json()
              throw new Error(error.message || 'Backend Google Login Failed')
            }

            const data = await r.json()
            localStorage.setItem('token', data.token)
            localStorage.setItem('user', JSON.stringify(data.user))

            if (currentResolve) currentResolve(data)
          } catch (err) {
            if (currentReject) currentReject(err)
          }
        }
      },
      error_callback: (err) => {
        if (err.type === 'popup_closed') {
          if (currentReject) currentReject(new Error('Sign in cancelled'))
        } else {
          console.warn('Google Auth Error:', err)
          if (currentReject) currentReject(err)
        }
      }
    });
  }
}

export async function googleSignin() {
  const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'CUSTOM_CLIENT_ID_NEEDED'

  // If no valid Client ID is provided, use the Mock implementation
  if (CLIENT_ID === 'CUSTOM_CLIENT_ID_NEEDED') {
    return new Promise((resolve, reject) => useMockFallback(resolve, reject))
  }

  // Try Real Google Login
  try {
    if (typeof google === 'undefined') {
      // Retry once after a short delay if script is not ready
      await new Promise(r => setTimeout(r, 500));
      if (typeof google === 'undefined') throw new Error('Google script not loaded')
    }

    // Ensure client is initialized
    prepareGoogleLogin();

    return new Promise((resolve, reject) => {
      // Save resolvers for the callback to use
      currentResolve = resolve;
      currentReject = reject;

      // Trigger the popup
      // This uses the existing client, which is faster and trusted by browser logic
      if (tokenClient) {
        tokenClient.requestAccessToken();
      } else {
        reject(new Error("Google Client failed to initialize"));
      }
    })
  } catch (e) {
    return new Promise((resolve, reject) => useMockFallback(resolve, reject))
  }
}

// Fallback Mock Implementation (reused from previous step)
async function useMockFallback(resolve, reject) {
  // 1. Setup the message listener first
  const handleMessage = async (event) => {
    if (event.data?.type === 'GOOGLE_SIGNIN_SUCCESS') {
      window.removeEventListener('message', handleMessage)
      if (popup) popup.close()

      try {
        // 4. Proceed with Backend Login using selected user data
        const selectedUser = event.data.user

        const r = await fetch(BASE + '/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: selectedUser.email,
            name: selectedUser.name,
            googleId: 'gid_' + Date.now()
          })
        })

        if (!r.ok) {
          const error = await r.json()
          throw new Error(error.message || 'Google Signin failed')
        }

        const data = await r.json()
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        resolve(data)
      } catch (e) {
        reject(e)
      }
    }
  }

  window.addEventListener('message', handleMessage)

  // 2. Open Popup
  const width = 450
  const height = 500
  const left = window.screenX + (window.outerWidth - width) / 2
  const top = window.screenY + (window.outerHeight - height) / 2

  const popup = window.open(
    '',
    'google_login_popup',
    `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,status=yes`
  )

  if (!popup) {
    window.removeEventListener('message', handleMessage)
    reject(new Error('Popup blocked by browser'))
    return
  }

  // 3. Inject Content: Account Chooser UI
  const htmlContent = `
      <html>
        <head>
          <title>Sign in - Google Accounts (MOCK)</title>
          <style>
            body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 20px; color: #202124; display: flex; flex-direction: column; align-items: center; }
            .logo { margin-bottom: 10px; }
            h1 { font-size: 24px; font-weight: 400; margin: 0 0 10px 0; }
            p { font-size: 16px; margin: 0 0 30px 0; color: #5f6368; }
            .account-list { width: 100%; max-width: 360px; border: 1px solid #dadce0; border-radius: 8px; overflow: hidden; }
            .account-item { display: flex; align-items: center; padding: 12px 15px; border-bottom: 1px solid #dadce0; cursor: pointer; transition: background 0.2s; }
            .account-item:last-child { border-bottom: none; }
            .account-item:hover { background-color: #f7f8f8; }
            .avatar { width: 32px; height: 32px; border-radius: 50%; background-color: #a0c3ff; color: #1e3a8a; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px; font-size: 14px; }
            .info { display: flex; flex-direction: column; }
            .name { font-size: 14px; font-weight: 500; color: #3c4043; }
            .email { font-size: 12px; color: #5f6368; }
            .banner { background: #ffebee; color: #c62828; padding: 10px; width: 100%; text-align: center; margin-bottom: 10px; border-radius: 4px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="banner">Development Mode: Using Mock Accounts</div>
          <div class="logo">
             <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48px" height="48px">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            </svg>
          </div>
          <h1>Choose an account</h1>
          <p>to continue to Shree Mobiles</p>

          <div class="account-list">
            <div class="account-item" onclick="selectAccount('Rajesh Kumar', 'rajesh@gmail.com')">
              <div class="avatar" style="background: #ef4444; color: white;">R</div>
              <div class="info">
                <span class="name">Rajesh Kumar</span>
                <span class="email">rajesh@gmail.com</span>
              </div>
            </div>
            
            <div class="account-item" onclick="selectAccount('Demo User', 'demo@example.com')">
              <div class="avatar" style="background: #10b981; color: white;">D</div>
              <div class="info">
                <span class="name">Demo User</span>
                <span class="email">demo@example.com</span>
              </div>
            </div>

            <div class="account-item" onclick="selectAccount('New User', 'new.user@gmail.com')">
               <div class="avatar" style="background: #f59e0b; color: white;">N</div>
               <div class="info">
                 <span class="name">New User</span>
                 <span class="email">new.user@gmail.com</span>
               </div>
            </div>
          </div>
          
          <script>
            function selectAccount(name, email) {
              window.opener.postMessage({
                type: 'GOOGLE_SIGNIN_SUCCESS',
                user: { name, email }
              }, '*')
            }
          </script>
        </body>
      </html>
    `

  popup.document.write(htmlContent)
}
