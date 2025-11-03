# PowerShell FTP Upload Script for Hostinger
# This script uploads the deployment files directly via FTP

param(
    [string]$FtpHost = "46.202.183.226",
    [string]$FtpUser = "u204461404.lightslategray-caribou-743803.hostingersite.com",
    [string]$FtpPass = "L0g!nSt@geX4",
    [string]$RemotePath = "public_html",
    [string]$LocalPath = "deploy"
)

Write-Host "Starting FTP upload to Hostinger..." -ForegroundColor Green

# Check if deploy folder exists
if (-not (Test-Path $LocalPath)) {
    Write-Host "ERROR: '$LocalPath' folder not found!" -ForegroundColor Red
    Write-Host "   Run: powershell -File scripts/prepare-deployment.ps1 first" -ForegroundColor Yellow
    exit 1
}

# Create FTP URI
$ftpUri = "ftp://$FtpHost/$RemotePath/"

# Function to upload file
function Upload-File {
    param([string]$LocalFile, [string]$RemoteFile)
    
    try {
        $ftpRequest = [System.Net.FtpWebRequest]::Create("$ftpUri$RemoteFile")
        $ftpRequest.Credentials = New-Object System.Net.NetworkCredential($FtpUser, $FtpPass)
        $ftpRequest.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
        $ftpRequest.UseBinary = $true
        $ftpRequest.UsePassive = $true
        
        $fileContent = [System.IO.File]::ReadAllBytes($LocalFile)
        $ftpRequest.ContentLength = $fileContent.Length
        
        $requestStream = $ftpRequest.GetRequestStream()
        $requestStream.Write($fileContent, 0, $fileContent.Length)
        $requestStream.Close()
        
        $response = $ftpRequest.GetResponse()
        $response.Close()
        
        Write-Host "  [OK] Uploaded: $RemoteFile" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "  [FAIL] Failed: $RemoteFile - $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to upload directory
function Upload-Directory {
    param([string]$LocalDir, [string]$RemoteDir)
    
    $items = Get-ChildItem -Path $LocalDir -Force
    
    foreach ($item in $items) {
        if ($RemoteDir) {
            $remotePath = "$RemoteDir/$($item.Name)"
        } else {
            $remotePath = $item.Name
        }
        
        if ($item.PSIsContainer) {
            # Create directory on FTP (if needed)
            try {
                $ftpRequest = [System.Net.FtpWebRequest]::Create("$ftpUri$remotePath/")
                $ftpRequest.Credentials = New-Object System.Net.NetworkCredential($FtpUser, $FtpPass)
                $ftpRequest.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
                $ftpRequest.UsePassive = $true
                $response = $ftpRequest.GetResponse()
                $response.Close()
            }
            catch {
                # Directory might already exist, continue
            }
            
            Write-Host "Creating directory: $remotePath/" -ForegroundColor Cyan
            Upload-Directory -LocalDir $item.FullName -RemoteDir $remotePath
        }
        else {
            Upload-File -LocalFile $item.FullName -RemoteFile $remotePath
        }
    }
}

Write-Host "Uploading files from '$LocalPath' to '$ftpUri'..." -ForegroundColor Cyan
Write-Host ""

# Upload all files
$uploaded = 0
$failed = 0

$items = Get-ChildItem -Path $LocalPath -Force

foreach ($item in $items) {
    if ($item.PSIsContainer) {
        Write-Host "Uploading folder: $($item.Name)" -ForegroundColor Yellow
        Upload-Directory -LocalDir $item.FullName -RemoteDir $item.Name | Out-Null
    }
    else {
        $result = Upload-File -LocalFile $item.FullName -RemoteFile $item.Name
        if ($result) { 
            $uploaded++ 
        } else { 
            $failed++ 
        }
    }
}

Write-Host ""
Write-Host "Upload complete!" -ForegroundColor Green
if ($uploaded -gt 0) {
    Write-Host "   Files uploaded: $uploaded" -ForegroundColor Green
}
if ($failed -gt 0) {
    Write-Host "   Files failed: $failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. SSH into server: ssh $FtpUser@$FtpHost" -ForegroundColor White
Write-Host "2. Navigate: cd $RemotePath" -ForegroundColor White
Write-Host "3. Install: npm install --production" -ForegroundColor White
Write-Host "4. Create .env.local with your API keys" -ForegroundColor White
Write-Host "5. Start: pm2 start npm --name taleweave -- start" -ForegroundColor White
