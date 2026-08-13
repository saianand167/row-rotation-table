@echo off
echo Adding Windows Firewall rule for RRT Backend (Port 5000)...
netsh advfirewall firewall delete rule name="RRT Backend Port 5000" >nul 2>&1
netsh advfirewall firewall add rule name="RRT Backend Port 5000" dir=in action=allow protocol=TCP localport=5000
echo.
echo Done! Your phone should now be able to reach the backend at http://10.196.17.82:5000
echo.
pause
