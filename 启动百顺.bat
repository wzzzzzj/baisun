@echo off
chcp 65001 >nul
title 百顺进销存财务系统
echo ============================================
echo    百顺进销存财务系统 启动中...
echo ============================================
echo.
echo 启动后请用浏览器访问: http://localhost:8888
echo 手机(同一局域网)访问: http://192.168.5.133:8888
echo.
echo 关闭此窗口即可停止服务器
echo ============================================
echo.
set JAVA_HOME=D:\java
cd /d D:\TRAE_\baishun
D:\maven\apache-maven-3.9.10\bin\mvn.cmd spring-boot:run
pause
