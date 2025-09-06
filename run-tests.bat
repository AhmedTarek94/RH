@echo off
echo ========================================
echo    RHAT Extension Test Pages
echo ========================================
echo.
echo Opening test pages in default browser...
echo.
echo Test Main Page: Simulates RaterHub main page with random task detection
start test-main.html
echo.
echo Test Task Page: Simulates task page after acquisition
start test-task.html
echo.
echo ========================================
echo Instructions:
echo 1. Make sure RHAT extension is loaded in Chrome
echo 2. Enable the extension and set to 'Alarm & acquire' mode
echo 3. Test the workflow using the controls on each page
echo 4. Check browser console for extension logs
echo ========================================
pause
