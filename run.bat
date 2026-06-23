@echo off
chcp 65001 >nul
echo.
echo  ========================================
echo   압축기 경쟁 인텔리전스 대시보드 실행
echo  ========================================
echo.

cd /d "%~dp0frontend"

echo  Python HTTP 서버를 시작합니다 (포트 8000)...
echo  브라우저가 자동으로 열립니다.
echo.
echo  종료하려면 이 창에서 Ctrl+C 를 누르세요.
echo.

start "" "http://localhost:8000/Compressor%%20Dashboard.dc.html"
python -m http.server 8000
