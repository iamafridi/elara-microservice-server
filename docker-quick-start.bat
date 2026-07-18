@echo off
echo ================================
echo Elara Platform - Quick Start
echo ================================
echo.

echo Step 1: Starting infrastructure...
docker-compose up -d postgres redis minio pgadmin

echo.
echo Step 2: Waiting for database to be ready...
timeout /t 15 /nobreak >nul

echo.
echo Step 3: Infrastructure is ready!
echo.
echo - PostgreSQL: localhost:5432
echo - Redis: localhost:6379
echo - pgAdmin: http://localhost:5050
echo - MinIO: http://localhost:9001
echo.
echo To build and start services, run:
echo   docker-compose build api-gateway
echo   docker-compose up -d api-gateway
echo.
pause
