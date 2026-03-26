param(
  [string]$SourcePath = (Join-Path $PSScriptRoot "..\\src\\world-states.svg"),
  [string]$OutputPath = (Join-Path $PSScriptRoot "..\\src\\js\\app\\world-map-inline.js")
)

$ErrorActionPreference = "Stop"

$svg = Get-Content -Raw -Path $SourcePath -Encoding UTF8
Add-Type -AssemblyName System.Web
$json = '"' + [System.Web.HttpUtility]::JavaScriptStringEncode($svg) + '"'

$body = @(
  "(function(global){"
  "  global.NexusWorldMapInlineSvg = $json;"
  "})(window);"
) -join "`r`n"

Set-Content -Path $OutputPath -Value $body -Encoding UTF8
Write-Host "Wrote inline world map asset to $OutputPath"
