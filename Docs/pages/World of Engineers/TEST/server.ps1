# Simple Local Web Server in PowerShell
# Serves the folder where this script is located
# URL: http://localhost:8020/

$root = Split-Path -Parent $MyInvocation.MyCommand.Definition

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8020/")
$listener.Start()

Write-Host "Serving $root at http://localhost:8020/"
Write-Host "Press CTRL+C to stop."

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $localPath = $request.Url.LocalPath.TrimStart("/")
        if ($localPath -eq "") { $localPath = "index.html" }

        $filePath = Join-Path $root $localPath

        if (Test-Path $filePath) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)

            switch ([System.IO.Path]::GetExtension($filePath)) {
                ".html" { $response.ContentType = "text/html" }
                ".js"   { $response.ContentType = "application/javascript" }
                ".css"  { $response.ContentType = "text/css" }
                ".json" { $response.ContentType = "application/json" }
                ".png"  { $response.ContentType = "image/png" }
                ".jpg"  { $response.ContentType = "image/jpeg" }
                ".jpeg" { $response.ContentType = "image/jpeg" }
                ".gif"  { $response.ContentType = "image/gif" }
                ".glb"  { $response.ContentType = "model/gltf-binary" }
                ".mp3"  { $response.ContentType = "audio/mpeg" }
                default { $response.ContentType = "application/octet-stream" }
            }

            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        }
        else {
            $response.StatusCode = 404
            $error = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.OutputStream.Write($error, 0, $error.Length)
        }

        $response.Close()
    }
    catch {
        Write-Host "Server stopped."
        break
    }
}
