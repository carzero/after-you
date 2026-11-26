@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 goto node_missing
node -e "if (Number(process.versions.node.split('.')[0]) < 24) process.exit(1)"
if errorlevel 1 goto node_missing
where npm >nul 2>&1
if errorlevel 1 goto node_missing
if not exist package.json goto wrong_folder
if not exist wrangler.jsonc goto wrong_folder

echo [1/3] Installing project dependencies...
call npm ci
if errorlevel 1 goto failed

echo [2/3] Connecting to Cloudflare...
if defined CLOUDFLARE_API_TOKEN (
  call npx wrangler whoami
) else (
  call npx wrangler login
)
if errorlevel 1 goto failed

echo [3/3] Building and deploying the game and ranking server...
call npm run deploy:cloudflare
if errorlevel 1 goto failed

echo.
echo Deployment completed. Open the workers.dev URL printed above.
echo You can share the URL or the error text, but never share API tokens.
pause
exit /b 0

:node_missing
echo Install Node.js 24 LTS or newer from https://nodejs.org/ and reopen CMD.
pause
exit /b 1

:wrong_folder
echo Extract the entire ZIP first. Keep DEPLOY.cmd beside package.json and wrangler.jsonc.
pause
exit /b 1

:failed
echo.
echo A command failed. Read the error above; deployment may not have completed.
echo Do not send tokens or other credentials when sharing the error.
pause
exit /b 1
