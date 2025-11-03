# Upload Files to Hostinger - No FTP Client Needed

## Option 1: Automated PowerShell Upload (Easiest!)

I've created an automated script that uploads everything for you:

```powershell
# Just run this command:
powershell -ExecutionPolicy Bypass -File scripts/upload-to-hostinger.ps1
```

This will automatically:
- Connect to Hostinger FTP
- Upload all files from the `deploy/` folder
- Show progress as it uploads

**That's it!** Then follow the SSH steps below.

---

## Option 2: Install FileZilla (Free, 2 minutes)

1. Download FileZilla: https://filezilla-project.org/download.php?type=client
2. Install it
3. Use these settings:
   - **Host:** `46.202.183.226`
   - **Port:** `21`
   - **Username:** `u204461404.lightslategray-caribou-743803.hostingersite.com`
   - **Password:** `L0g!nSt@geX4`
   - **Quickconnect**
4. Drag and drop contents of `deploy/` folder to `public_html/`

---

## Option 3: Use Hostinger File Manager

1. Log into Hostinger control panel
2. Go to **File Manager**
3. Navigate to `public_html/`
4. Click **Upload**
5. Upload all files from the `deploy/` folder (may need to zip them first)

---

## Option 4: Windows Built-in FTP (Command Line)

Open Command Prompt or PowerShell and run:

```cmd
cd deploy
ftp 46.202.183.226
```

Then enter:
- Username: `u204461404.lightslategray-caribou-743803.hostingersite.com`
- Password: `L0g!nSt@geX4`
- `binary` (to set binary mode)
- `cd public_html`
- `mput *` (upload all files)

*Note: This is more complex and doesn't handle folders well.*

---

## Recommended: Use Option 1 (PowerShell Script)

The PowerShell script I created will handle everything automatically. Just run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/upload-to-hostinger.ps1
```

Then continue with the SSH steps from `QUICK_DEPLOY.md`.

