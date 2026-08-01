# Check Windows notification settings for Chrome
Write-Host "=== Checking Windows Notification Settings ==="

$notifPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Notifications\Settings"
$children = Get-ChildItem $notifPath -ErrorAction SilentlyContinue

foreach ($child in $children) {
    if ($child.PSChildName -like "*chrome*" -or $child.PSChildName -like "*Chrome*" -or $child.PSChildName -like "*Google*") {
        Write-Host "`nFound Chrome notification key: $($child.PSChildName)"
        $props = Get-ItemProperty $child.PSPath
        $props | Format-List
    }
}

# Check Focus Assist
Write-Host "`n=== Checking Focus Assist / Do Not Disturb ==="
$focusAssist = Get-ItemProperty "HKCU:\Software\Microsoft\Windows\CurrentVersion\CloudStore\Store\DefaultAccount\Current\default`$windows.data.notifications.quiethoursprofile\windows.data.notifications.quiethoursprofile" -ErrorAction SilentlyContinue
if ($focusAssist) {
    Write-Host "Focus Assist settings found"
    $focusAssist | Format-List
} else {
    Write-Host "Focus Assist: Could not read (may be off)"
}

# Check if Chrome is using native notifications
Write-Host "`n=== Chrome Browser Check ==="
$chromeProcess = Get-Process chrome -ErrorAction SilentlyContinue
if ($chromeProcess) {
    Write-Host "Chrome is running with $($chromeProcess.Count) processes"
} else {
    Write-Host "Chrome is NOT running"
}

Write-Host "`nDone."
