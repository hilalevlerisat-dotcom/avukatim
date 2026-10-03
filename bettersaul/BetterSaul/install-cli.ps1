param(
    [Parameter(Mandatory = $true)][ValidateSet("claude", "codex", "desktop")][string]$Cli,
    [string]$Status = "",
    [string]$LogDir = "$env:LOCALAPPDATA\BetterSaul\logs"
)
# Claude Code / ChatGPT Codex kendi resmî yükleyicisiyle, Claude Desktop resmî Anthropic
# paketinden kurulur. Giriş yapılmaz, kimlik dosyası okunmaz; günlüğe yalnızca yükleyici
# çıktısı yazılır. $Status dosyasına "yüzde|metin", bitince "DONE|metin" yazılır.
$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$log = Join-Path $LogDir "cli-install-$Cli.log"
$name = @{ claude = "Claude Code"; codex = "ChatGPT Codex"; desktop = "Claude Desktop" }[$Cli]

function Write-Log([string]$msg) {
    Add-Content -Path $log -Value ("{0:yyyy-MM-dd HH:mm:ss} {1}" -f (Get-Date), $msg) -Encoding UTF8
}

function Set-Status([string]$pct, [string]$text) {
    if (-not $Status) { return }
    try {
        $tmp = "$Status.tmp"
        Set-Content -Path $tmp -Value "$pct|$text" -Encoding UTF8
        Move-Item -Force -Path $tmp -Destination $Status
    } catch { }
}

function Add-UserPath([string]$dir, [switch]$Force) {
    if (-not $dir -or (-not $Force -and -not (Test-Path $dir))) { return }
    $cur = [Environment]::GetEnvironmentVariable("Path", "User")
    $parts = @($cur -split ";" | Where-Object { $_ })
    if ($parts | Where-Object { $_.TrimEnd("\") -ieq $dir.TrimEnd("\") }) { return }
    [Environment]::SetEnvironmentVariable("Path", (($parts + $dir) -join ";"), "User")
    Write-Log "PATH'e eklendi: $dir"
}

function Get-Json([string]$url) {
    $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 60
    $c = $r.Content
    if ($c -is [byte[]]) { $c = [Text.Encoding]::UTF8.GetString($c) }
    return $c
}

# Resmî yükleyici betiğini ayrı süreçte çalıştırır; $progress her 500 ms'de yüzde üretir.
function Invoke-Official([string]$url, [scriptblock]$progress) {
    $script = Join-Path $env:TEMP "bettersaul-$Cli-install.ps1"
    $out = "$script.out"; $err = "$script.err"
    try {
        Invoke-WebRequest -Uri $url -OutFile $script -UseBasicParsing -TimeoutSec 120
        $p = Start-Process powershell.exe -WindowStyle Hidden -PassThru `
            -ArgumentList "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", "`"$script`"" `
            -RedirectStandardOutput $out -RedirectStandardError $err
        $t0 = Get-Date
        while (-not $p.HasExited) {
            & $progress ((Get-Date) - $t0).TotalSeconds
            Start-Sleep -Milliseconds 500
        }
        $p.WaitForExit()
        $text = ((Get-Content $out -Raw -ErrorAction SilentlyContinue) + "`n" + (Get-Content $err -Raw -ErrorAction SilentlyContinue)).Trim()
        Write-Log ("Cikis kodu {0}`n{1}" -f $p.ExitCode, $text)
        return $true
    } catch {
        Write-Log ("Basarisiz: " + $_.Exception.Message)
        return $false
    } finally {
        Remove-Item -Force -ErrorAction SilentlyContinue $script, $out, $err
    }
}

# Yazılmakta olan dosyanın gerçek boyutu (klasör listesi kapanana kadar eski boyutu gösterir).
function Get-LiveSize([string]$path) {
    try {
        $s = [IO.File]::Open($path, [IO.FileMode]::Open, [IO.FileAccess]::Read, [IO.FileShare]"ReadWrite, Delete")
        try { return $s.Length } finally { $s.Close() }
    } catch { return 0L }
}

# Resmî yükleyiciler dosyayı sonda yazdığından ilerleme, ağ kartlarına gelen baytla ölçülür.
function Get-RxBytes {
    $sum = 0L
    foreach ($n in [Net.NetworkInformation.NetworkInterface]::GetAllNetworkInterfaces()) {
        if ($n.OperationalStatus -ne "Up" -or $n.NetworkInterfaceType -eq "Loopback") { continue }
        try { $sum += $n.GetIPStatistics().BytesReceived } catch { }
    }
    return $sum
}

function Resolve-DesktopUrl {
    $ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
    $curl = Join-Path $env:SystemRoot "System32\curl.exe"
    if (Test-Path $curl) {
        $u = & $curl -s -o NUL -w "%{redirect_url}" -A $ua -H "Accept: text/html" "https://claude.ai/api/desktop/win32/x64/exe/latest/redirect"
        if ($u -match '^https://downloads\.claude\.ai/.+\.exe$') { return $u }
    }
    $r = [Net.HttpWebRequest]::Create("https://claude.ai/api/desktop/win32/x64/msix/latest/redirect")
    $r.UserAgent = $ua
    $r.AllowAutoRedirect = $false
    $x = $r.GetResponse()
    try { $loc = $x.Headers["Location"] } finally { $x.Close() }
    if ($loc -match '^https://downloads\.claude\.ai/.+\.msix$') { return ($loc -replace '\.msix$', '.exe') }
    throw "indirme adresi alinamadi"
}

function Estimate([double]$sec, [double]$tau) {
    return [int](5 + 85 * (1 - [Math]::Exp(-$sec / $tau)))
}

Set-Status 1 "$name hazırlanıyor…"
Write-Log "Basladi: $name"

switch ($Cli) {
    "claude" {
        $size = 0
        try {
            $base = "https://downloads.claude.ai/claude-code-releases"
            $ver = (Get-Json "$base/latest").Trim()
            $size = [long]((Get-Json "$base/$ver/manifest.json" | ConvertFrom-Json).platforms."win32-x64".size)
        } catch { }
        $dl = Join-Path $env:USERPROFILE ".claude\downloads"
        $state = @{ seen = $false }
        $rx0 = Get-RxBytes
        $ok = Invoke-Official "https://claude.ai/install.ps1" {
            param($sec)
            $f = Get-ChildItem $dl -Filter "claude-*.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($f -and $size -gt 0) {
                $state.seen = $true
                $len = [Math]::Max((Get-LiveSize $f.FullName), [Math]::Min((Get-RxBytes) - $rx0, $size))
                $pct = [int](5 + 80 * [Math]::Min(1.0, $len / $size))
                $mb = [int]($len / 1MB); $tot = [int]($size / 1MB)
                if ((Get-LiveSize $f.FullName) -ge $size) { Set-Status 88 "Claude Code kuruluyor…" }
                else { Set-Status $pct "Claude Code indiriliyor… $mb / $tot MB" }
            } elseif ($state.seen) {
                Set-Status 95 "Claude Code ayarları tamamlanıyor…"
            } else {
                Set-Status (Estimate $sec 60) "Claude Code indiriliyor…"
            }
        }
        $exe = Join-Path $env:USERPROFILE ".local\bin\claude.exe"
        if (Test-Path $exe) { Add-UserPath (Split-Path $exe) }
        $done = $ok -and (Test-Path $exe)
    }
    "codex" {
        $rx0 = Get-RxBytes
        $ok = Invoke-Official "https://chatgpt.com/codex/install.ps1" {
            param($sec)
            $mb = [int](((Get-RxBytes) - $rx0) / 1MB)
            Set-Status (Estimate $sec 25) "ChatGPT Codex indiriliyor ve kuruluyor… $mb MB"
        }
        $standalone = "$env:USERPROFILE\.codex\packages\standalone"
        $exe = $null
        for ($i = 0; $i -lt 40 -and -not $exe; $i++) {
            $cands = @(
                "$env:LOCALAPPDATA\Programs\OpenAI\Codex\bin\codex.exe",
                "$env:USERPROFILE\.local\bin\codex.exe",
                "$standalone\current\bin\codex.exe",
                "$standalone\current\codex.exe"
            ) + @(Get-ChildItem "$standalone\releases\*\bin\codex.exe" -ErrorAction SilentlyContinue |
                    Sort-Object LastWriteTime -Descending | ForEach-Object FullName)
            $exe = $cands | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
            if (-not $exe) { Start-Sleep -Milliseconds 500 }
        }
        if ($exe) {
            Write-Log "Bulundu: $exe"
            $bin = if ($exe -like "$standalone\*") { "$standalone\current\bin" } else { Split-Path $exe }
            if (-not (Get-Command codex.exe -ErrorAction SilentlyContinue)) { Add-UserPath $bin -Force }
        }
        $done = [bool]$exe
    }
    "desktop" {
        $pkg = Get-AppxPackage -ErrorAction SilentlyContinue | Where-Object { $_.Name -like "*Claude*" -and $_.Publisher -like "*Anthropic*" }
        $exe = "$env:LOCALAPPDATA\AnthropicClaude\claude.exe"
        if ($pkg -or (Test-Path $exe)) {
            Write-Log "Zaten kurulu."
            $done = $true
            break
        }
        # Resmî Windows yükleyicisi (Anthropic imzalı, kullanıcı klasörüne kurar, yönetici izni istemez).
        $setup = Join-Path $env:TEMP "bettersaul-claude-desktop-setup.exe"
        $done = $false
        for ($try = 1; $try -le 3 -and -not $done; $try++) {
            $fs = $null
            try {
                $url = Resolve-DesktopUrl
                Write-Log "Indirme adresi: $url"
                $req = [Net.HttpWebRequest]::Create($url)
                $req.UserAgent = "BetterSaulSetup"
                $req.Timeout = 60000
                $resp = $req.GetResponse()
                $total = $resp.ContentLength
                $in = $resp.GetResponseStream()
                $fs = [IO.File]::Create($setup)
                $buf = New-Object byte[] 262144
                $got = 0L; $last = Get-Date
                while (($n = $in.Read($buf, 0, $buf.Length)) -gt 0) {
                    $fs.Write($buf, 0, $n); $got += $n
                    if (((Get-Date) - $last).TotalMilliseconds -ge 400) {
                        $last = Get-Date
                        $pct = if ($total -gt 0) { [int](2 + 83 * $got / $total) } else { 40 }
                        Set-Status $pct ("Claude Desktop indiriliyor… {0} / {1} MB" -f [int]($got / 1MB), [int]($total / 1MB))
                    }
                }
                $fs.Close(); $fs = $null; $in.Close(); $resp.Close()
                Write-Log ("Indirildi: {0} bayt, {1}" -f $got, $resp.ResponseUri)
                if ($total -gt 0 -and $got -lt $total) { throw "eksik indirme" }
                $sig = Get-AuthenticodeSignature $setup
                if ($sig.Status -ne "Valid" -or $sig.SignerCertificate.Subject -notlike "*Anthropic*") {
                    throw "imza dogrulanamadi: $($sig.Status)"
                }
                $p = Start-Process $setup -ArgumentList "--silent" -PassThru
                $t0 = Get-Date
                while (-not $p.HasExited) {
                    $sec = ((Get-Date) - $t0).TotalSeconds
                    Set-Status ([int](86 + 12 * (1 - [Math]::Exp(-$sec / 15)))) "Claude Desktop kuruluyor…"
                    Start-Sleep -Milliseconds 500
                }
                Write-Log "Yukleyici cikis kodu $($p.ExitCode)"
                for ($i = 0; $i -lt 20 -and -not (Test-Path $exe); $i++) { Start-Sleep -Milliseconds 500 }
                $done = Test-Path $exe
                if (-not $done) { break }
            } catch {
                Write-Log ("Deneme {0} basarisiz: {1}" -f $try, $_.Exception.Message)
                if ($fs) { $fs.Close() }
                Start-Sleep -Seconds 3
            } finally {
                Remove-Item -Force -ErrorAction SilentlyContinue $setup
            }
        }
    }
}

if ($done) { Set-Status "DONE" "$name kuruldu." } else { Set-Status "FAIL" "$name kurulamadı." }
Write-Log ("Sonuc: " + $(if ($done) { "kuruldu" } else { "kurulamadi" }))
exit 0
