@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 goto node_missing
node -e "if (Number(process.versions.node.split('.')[0]) < 24) process.exit(1)"
if errorlevel 1 goto node_missing
if not exist wrangler.jsonc goto wrong_folder
if not exist package.json goto wrong_folder

echo [1/2] Installing update dependencies...
call npm ci
if errorlevel 1 goto failed

echo [2/2] Deploying the update with your existing Cloudflare login...
call npm run deploy:cloudflare
if errorlevel 1 goto failed

echo.
echo Update completed. Refresh the game with Ctrl+F5.
echo The existing ranking storage binding is unchanged.
pause
exit /b 0

:node_missing
echo Install Node.js 24 or newer and reopen CMD.
pause
exit /b 1
:wrong_folder
echo Extract the entire ZIP first. Keep UPDATE.cmd beside package.json and wrangler.jsonc.
pause
exit /b 1
:failed
echo Update did not complete. Read the error above.
echo If Cloudflare asks for authentication, run DEPLOY.cmd to log in and deploy.
echo Never share tokens or passwords when sending an error message.
pause
exit /b 1
