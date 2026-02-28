$ErrorActionPreference = "Stop"

Set-Location "C:\Users\thoma\Compsy\site"
Write-Host "Preview server running at http://localhost:8000"
python -m http.server 8000
