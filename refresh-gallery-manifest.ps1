$folders = @(
  "cube-exchange",
  "chads-wtf",
  "yes-coin",
  "mambo-coin",
  "solkongz",
  "turdles",
  "independent-projects"
)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$map = [ordered]@{}

foreach ($folder in $folders) {
  $dir = Join-Path $root "assets\$folder"
  $map["assets/$folder/"] = @(
    Get-ChildItem -LiteralPath $dir -File |
      Where-Object { $_.Extension -match '^\.(png|jpe?g|webp|gif|avif)$' } |
      Sort-Object Name |
      ForEach-Object { "assets/$folder/$($_.Name)" }
  )
}

$json = $map | ConvertTo-Json -Depth 4
Set-Content -LiteralPath (Join-Path $root "gallery-manifest.js") -Encoding UTF8 -Value ("window.PORTFOLIO_GALLERIES = " + $json + ";")
