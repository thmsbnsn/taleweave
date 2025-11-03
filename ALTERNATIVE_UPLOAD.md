# Alternative Upload Methods - If FTP Doesn't Work

Since the automated FTP upload is having connection issues, here are easier alternatives:

## Option 1: Hostinger File Manager (EASIEST - Recommended!)

1. **Log into Hostinger Control Panel**
   - Go to: https://hpanel.hostinger.com
   - Login with your Hostinger account

2. **Open File Manager**
   - Navigate to **Files** → **File Manager**
   - Or find **File Manager** in your dashboard

3. **Navigate to public_html**
   - Click on `public_html` folder

4. **Upload Files**
   - Click **Upload** button
   - **Method A:** Drag and drop all files from your local `deploy` folder
   - **Method B:** Select all files in `deploy` folder and upload
   - **Note:** You may need to upload folders separately (`.next`, `public`, etc.)

5. **That's it!** Files are uploaded.

---

## Option 2: Create ZIP and Upload via File Manager

If uploading many files is slow:

1. **Zip the deploy folder:**
   ```powershell
   Compress-Archive -Path deploy\* -DestinationPath deploy.zip
   ```

2. **Upload `deploy.zip` via Hostinger File Manager**

3. **Extract on server:**
   - SSH into server
   - Navigate to `public_html`
   - Extract: `unzip deploy.zip` (or use File Manager's extract feature)

---

## Option 3: Use Git Deployment (If Hostinger Supports)

If Hostinger has Git integration:

1. Push your code to GitHub
2. Connect Hostinger to your repository
3. Set build command: `npm run build`
4. Set start command: `npm start`
5. Add environment variables in Hostinger dashboard

---

## Option 4: Try Different FTP Settings

If you want to try FTP again, the connection might need:
- Active mode instead of passive
- Different port (SFTP uses 22, FTP uses 21)
- Firewall exception on your network

**For now, I recommend Option 1 (File Manager) - it's the easiest!**

---

## After Uploading Files

Once files are uploaded, SSH into your server:

```bash
ssh u204461404@46.202.183.226
cd public_html
npm install --production
# Create .env.local with your API keys
pm2 start npm --name "taleweave" -- start
```

