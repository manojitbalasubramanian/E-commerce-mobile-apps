
# 🔑 How to Setup Real Google Login

To use **realtime, secure Google Login**, you must create a meaningful "Project" in the Google Cloud Console and register this development environment. This allows visitors to truly sign in with their Google accounts.

## Step 1: Create a Google Project
1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Click **Select a project** > **New Project**.
3.  Name it "Shree Mobiles Dev" and click **Create**.

## Step 2: Configure OAuth Screen
1.  In the left menu, go to **APIs & Services** > **OAuth consent screen**.
2.  Select **External** (for testing) and click **Create**.
3.  **App Information**:
    *   **App name**: Shree Mobiles
    *   **User support email**: (Your email)
4.  **Developer contact**: (Your email)
5.  Click **Save and Continue** until finished.

## Step 3: Create Credentials (Client ID)
1.  Go to **APIs & Services** > **Credentials**.
2.  Click **+ CREATE CREDENTIALS** > **OAuth client ID**.
3.  **Application type**: Web application.
4.  **Name**: "Frontend Client".
5.  **Authorized JavaScript origins**: `http://localhost:5173`
    *   *(Note: This URL must match exactly where your frontend runs)*
6.  Click **Create**.
7.  Copy the **Client ID** (it looks like `123456789-abc123xyz.apps.googleusercontent.com`).

## Step 4: Add to Project
1.  Open the file `frontend/.env` in this project.
2.  Add a new line at the bottom:
    ```
    VITE_GOOGLE_CLIENT_ID=YOUR_COPIED_CLIENT_ID_HERE
    ```
3.  **Restart the frontend server** (`npm run dev`) for the change to take effect.

Once done, the mock popup ("Development Mode") will disappear, and the real Google value-add login will work!
