# Local Web Server
# Serves the folder containing this script
# URL: http://localhost:8765/

$ErrorActionPreference = "Stop"

try {
    $root = Split-Path -Parent $MyInvocation.MyCommand.Definition

    Write-Host ""
    Write-Host "Root Folder: $root"
    Write-Host ""

    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://localhost:8765/")

    Write-Host "Starting server..."
a
    $listener.Start()

    Write-Host ""
    Write-Host "====================================="
    Write-Host " Server running"
    Write-Host " http://localhost:8765/"
    Write-Host "====================================="
    Write-Host ""
    Write-Host "Press CTRL+C to stop."
    Write-Host ""

    while ($listener.IsListening) {
        try {
            $context = $listener.GetContext()

            $request = $context.Request
            $response = $context.Response

            Write-Host "$(Get-Date -Format 'HH:mm:ss') $($request.HttpMethod) $($request.Url.LocalPath)"

            $localPath = $request.Url.LocalPath.TrimStart('/')

            if ([string]::IsNullOrWhiteSpace($localPath)) {
                $localPath = "index.html"
            }

            $filePath = Join-Path $root $localPath

            if (Test-Path $filePath) {

                $bytes = [System.IO.File]::ReadAllBytes($filePath)

                switch ([System.IO.Path]::GetExtension($filePath).ToLower()) {
                    ".html" { $response.ContentType = "text/html" }
                    ".js"   { $response.ContentType = "application/javascript" }
                    ".css"  { $response.ContentType = "text/css" }
                    ".json" { $response.ContentType = "application/json" }
                    ".png"  { $response.ContentType = "image/png" }
                    ".jpg"  { $response.ContentType = "image/jpeg" }
                    ".jpeg" { $response.ContentType = "image/jpeg" }
                    ".gif"  { $response.ContentType = "image/gif" }
                    ".svg"  { $response.ContentType = "image/svg+xml" }
                    ".glb"  { $response.ContentType = "model/gltf-binary" }
                    ".gltf" { $response.ContentType = "model/gltf+json" }
                    ".mp3"  { $response.ContentType = "audio/mpeg" }
                    ".wav"  { $response.ContentType = "audio/wav" }
                    default { $response.ContentType = "application/octet-stream" }
                }

                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            }
            else {
                Write-Host "404: $localPath"

                $response.StatusCode = 404

                $errorBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
                $response.OutputStream.Write($errorBytes, 0, $errorBytes.Length)
            }

            $response.Close()
        }
        catch {
            Write-Host ""
            Write-Host "Request Error:"
            Write-Host $_.Exception.Message
            Write-Host ""
        }
    }
}
catch {
    Write-Host ""
    Write-Host "====================================="
    Write-Host " SERVER FAILED TO START"
    Write-Host "====================================="
    Write-Host ""
    Write-Host $_.Exception.Message
    Write-Host ""
}
finally {
    if ($listener) {
        try {
            $listener.Stop()
            $listener.Close()
        }
        catch {}
    }

    Write-Host ""
    Write-Host "Server stopped."
    Write-Host ""

    Read-Host "Press Enter to exit"
}