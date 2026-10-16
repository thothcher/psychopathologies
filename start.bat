@echo off
rem Double-click to start the study site and open it in your browser.
cd /d "%~dp0"
node server.js --open
pause
