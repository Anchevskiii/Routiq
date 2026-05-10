# Stops processes that are LISTENING on the given TCP port(s) (Windows).
# Used by Routiq npm pre-hooks so backend always binds :3000 and Vite :5173.
param(
  [Parameter(Mandatory = $true)]
  [int[]] $Port
)

foreach ($p in $Port) {
  $listeners = @(
    Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
  )

  if ($listeners.Count -eq 0) {
    Write-Host "[free-port] Port $p is free."
    continue
  }

  $uniquePids = $listeners |
    Select-Object -ExpandProperty OwningProcess -Unique

  foreach ($processId in $uniquePids) {
    try {
      $proc = Get-Process -Id $processId -ErrorAction Stop
      Write-Host "[free-port] Port $p in use by PID $processId ($($proc.ProcessName)) - stopping."
      Stop-Process -Id $processId -Force -ErrorAction Stop
    } catch {
      $err = $_.Exception.Message
      Write-Warning "[free-port] Could not stop PID $processId on port $p - $err"
    }
  }
}
