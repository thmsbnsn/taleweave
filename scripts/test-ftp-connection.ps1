# Test FTP Connection to Hostinger

$FtpHost = "46.202.183.226"
$FtpUser = "u204461404.lightslategray-caribou-743803.hostingersite.com"
$FtpPass = "L0g!nSt@geX4"
$RemotePath = "public_html"

Write-Host "Testing FTP connection to Hostinger..." -ForegroundColor Cyan

try {
    $ftpUri = "ftp://$FtpHost/$RemotePath/"
    $ftpRequest = [System.Net.FtpWebRequest]::Create($ftpUri)
    $ftpRequest.Credentials = New-Object System.Net.NetworkCredential($FtpUser, $FtpPass)
    $ftpRequest.Method = [System.Net.WebRequestMethods+Ftp]::ListDirectory
    $ftpRequest.UsePassive = $true
    $ftpRequest.UseBinary = $true
    
    Write-Host "Attempting connection..." -ForegroundColor Yellow
    $response = $ftpRequest.GetResponse()
    $responseStream = $response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($responseStream)
    $directoryListing = $reader.ReadToEnd()
    
    Write-Host "SUCCESS! Connected to FTP server." -ForegroundColor Green
    Write-Host "Directory contents:" -ForegroundColor Cyan
    Write-Host $directoryListing
    
    $reader.Close()
    $response.Close()
}
catch {
    Write-Host "FAILED to connect: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible issues:" -ForegroundColor Yellow
    Write-Host "1. Firewall blocking FTP (port 21)" -ForegroundColor White
    Write-Host "2. FTP server requires active mode instead of passive" -ForegroundColor White
    Write-Host "3. Wrong credentials or host" -ForegroundColor White
    Write-Host "4. Need to use SFTP instead of FTP" -ForegroundColor White
    Write-Host ""
    Write-Host "Alternative: Use Hostinger File Manager in their dashboard" -ForegroundColor Cyan
}

