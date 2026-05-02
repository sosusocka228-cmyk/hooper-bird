$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 3000
$prefix = "http://localhost:$port/"

$types = @{
    ".html" = "text/html; charset=utf-8"
    ".css" = "text/css; charset=utf-8"
    ".js" = "application/javascript; charset=utf-8"
}

$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add($prefix)

try {
    $listener.Start()
    Write-Host "Flip Bird Dash running at $prefix"
    Write-Host "Press Ctrl+C to stop."

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $requestPath = [System.Uri]::UnescapeDataString($context.Request.Url.AbsolutePath)
        if ($requestPath -eq "/") {
            $requestPath = "/index.html"
        }

        $relative = $requestPath.TrimStart("/")
        $filePath = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($root, $relative))

        if (-not $filePath.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) {
            $context.Response.StatusCode = 403
            $context.Response.Close()
            continue
        }

        if (-not [System.IO.File]::Exists($filePath)) {
            $context.Response.StatusCode = 404
            $context.Response.Close()
            continue
        }

        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        $ext = [System.IO.Path]::GetExtension($filePath)
        $context.Response.ContentType = if ($types.ContainsKey($ext)) { $types[$ext] } else { "application/octet-stream" }
        $context.Response.ContentLength64 = $bytes.Length
        $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
        $context.Response.Close()
    }
}
finally {
    if ($listener.IsListening) {
        $listener.Stop()
    }
    $listener.Close()
}
