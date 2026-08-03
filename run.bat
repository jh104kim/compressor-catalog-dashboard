@echo off
chcp 65001 >nul
setlocal
echo.
echo  ========================================
echo   Samsung Compressor Catalog Audit Studio
echo  ========================================
echo.

cd /d "%~dp0"

if not exist "studio\node_modules" (
  echo  Studio 패키지를 최초 설치합니다...
  call npm --prefix studio ci
  if errorlevel 1 goto :error
)

echo  Compare Report를 생성합니다...
python scripts\build_compare_lab_report.py
if errorlevel 1 goto :error

echo  Studio production build를 생성합니다...
call npm --prefix studio run build
if errorlevel 1 goto :error

echo  FastAPI Runtime을 시작합니다 (포트 8000)...
echo  브라우저가 자동으로 열립니다.
echo.
echo  종료하려면 이 창에서 Ctrl+C 를 누르세요.
echo.

start "" "http://127.0.0.1:8000/?view=overview"
python -m uvicorn backend.catalog_audit.main:create_runtime_app --factory --host 127.0.0.1 --port 8000
goto :eof

:error
echo.
echo  실행 준비에 실패했습니다. 위 오류를 확인하세요.
pause
exit /b 1
