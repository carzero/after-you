param([string]$PackageVersion = '')
$ErrorActionPreference = 'Stop'
$global:LASTEXITCODE = 0
Set-StrictMode -Version Latest
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$id = Get-Content (Join-Path $PSScriptRoot 'identity.json') -Raw -Encoding UTF8 | ConvertFrom-Json
if ($PackageVersion) { $id.packageVersion = $PackageVersion }
$version = [Version]$id.packageVersion
if ($version.Major -lt 1 -or $version.Revision -ne 0) { throw 'Store version must be >= 1.0.0.0 and end with .0.' }
if ($id.name -notmatch '^[A-Za-z0-9.-]{3,50}$') { throw 'Invalid package identity name.' }
if ($id.publisher -notmatch '^CN=[A-Fa-f0-9-]{36}$') { throw 'Verify Publisher from Partner Center.' }
$cache = Join-Path $env:LOCALAPPDATA 'AfterYouStoreBuild'
$out = Join-Path $root 'build\store'
New-Item $cache,$out -ItemType Directory -Force | Out-Null
$dotnet = Get-Command dotnet -ErrorAction SilentlyContinue
if (-not $dotnet -or -not ((& $dotnet.Source --list-sdks) -match '^10\.')) {
    $install = Join-Path $cache 'dotnet-install.ps1'
    Invoke-WebRequest 'https://dot.net/v1/dotnet-install.ps1' -OutFile $install -UseBasicParsing
    & $install -Channel '10.0' -InstallDir (Join-Path $cache 'dotnet') -NoPath
    if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) { throw 'Could not install .NET SDK.' }
    $dotnetExe = Join-Path $cache 'dotnet\dotnet.exe'
} else { $dotnetExe = $dotnet.Source }
if (-not (Test-Path (Join-Path $root 'dist\index.html'))) { throw 'Bundled dist is missing. Run npm ci and npm run build at repository root.' }
$publish = Join-Path $out 'publish'
if (Test-Path $publish) { Remove-Item $publish -Recurse -Force }
& $dotnetExe publish (Join-Path $PSScriptRoot 'AfterYou.Windows.csproj') -c Release -r win-x64 --self-contained false -o $publish
if ($LASTEXITCODE -ne 0) { throw 'Windows build failed.' }
$layout = Join-Path $out 'layout'
if (Test-Path $layout) { Remove-Item $layout -Recurse -Force }
New-Item $layout -ItemType Directory -Force | Out-Null
Copy-Item $publish (Join-Path $layout 'App') -Recurse
Get-ChildItem (Join-Path $layout 'App') -Filter '*.pdb' | Remove-Item
Copy-Item (Join-Path $PSScriptRoot 'Assets') (Join-Path $layout 'Assets') -Recurse
Remove-Item (Join-Path $layout 'Assets\Game.ico')
Copy-Item (Join-Path $PSScriptRoot 'ThirdParty') (Join-Path $layout 'App\ThirdParty') -Recurse
$xml = Get-Content (Join-Path $PSScriptRoot 'AppxManifest.template.xml') -Raw -Encoding UTF8
$values = @{ NAME=$id.name; PUBLISHER=$id.publisher; VERSION=$id.packageVersion; DISPLAY=$id.displayName; PUBLISHER_DISPLAY=$id.publisherDisplayName; DESCRIPTION=$id.description }
foreach ($key in $values.Keys) { $xml = $xml.Replace("__$($key)__", [Security.SecurityElement]::Escape([string]$values[$key])) }
[IO.File]::WriteAllText((Join-Path $layout 'AppxManifest.xml'), $xml, (New-Object Text.UTF8Encoding($false)))
$toolsVersion = '10.0.26100.9457'
$tools = Join-Path $cache "sdk-$toolsVersion"
$makeappx = Get-ChildItem $tools -Recurse -Filter 'makeappx.exe' -ErrorAction SilentlyContinue | Where-Object { $_.FullName -match '\\x64\\' } | Select-Object -First 1
if (-not $makeappx) {
    $zip = Join-Path $cache 'sdk-tools.zip'
    Invoke-WebRequest "https://api.nuget.org/v3-flatcontainer/microsoft.windows.sdk.buildtools/$toolsVersion/microsoft.windows.sdk.buildtools.$toolsVersion.nupkg" -OutFile $zip -UseBasicParsing
    Expand-Archive -Path $zip -DestinationPath $tools -Force
    $makeappx = Get-ChildItem $tools -Recurse -Filter 'makeappx.exe' | Where-Object { $_.FullName -match '\\x64\\' } | Select-Object -First 1
}
if (-not $makeappx) { throw 'Windows MakeAppx tool was not found.' }
$name = "AFTER_YOU_Store_$($id.packageVersion)_x64"
$msix = Join-Path $out "$name.msix"
& $makeappx.FullName pack /d $layout /p $msix /o
if ($LASTEXITCODE -ne 0) { throw 'MSIX validation/packaging failed.' }
Add-Type -AssemblyName System.IO.Compression.FileSystem
$uploadDir = Join-Path $out 'upload'
New-Item $uploadDir -ItemType Directory -Force | Out-Null
Get-ChildItem $uploadDir | Remove-Item -Force
Copy-Item $msix $uploadDir
$upload = Join-Path $out "$name.msixupload"
if (Test-Path $upload) { Remove-Item $upload }
[IO.Compression.ZipFile]::CreateFromDirectory($uploadDir, $upload)
Get-FileHash $msix,$upload -Algorithm SHA256 | Format-Table -AutoSize
Write-Host "Upload to Partner Center: $msix" -ForegroundColor Green
Write-Host "Do not double-click the unsigned Store package for local installation. For a quick app test, run: $publish\AfterYou.Windows.exe"
