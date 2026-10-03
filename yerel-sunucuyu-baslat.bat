@echo off
color 0A
title Avukatim - Yerel Dosya Sunucusu

echo.
echo ===================================================
echo     AVUKAT ASISTANIM - YEREL DOSYA SUNUCUSU
echo ===================================================
echo.
echo Bu pencere acik kaldigi surece uygulamaniz
echo 36GB'lik yerel dosyalariniza buluta yuklemeden
echo erisebilecektir.
echo.

cd local-server
node server.js

pause
