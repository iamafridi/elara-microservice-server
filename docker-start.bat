@echo off
echo ================================
echo Elara Platform - Docker Start
echo ================================
echo.

echo Starting infrastructure services...
docker-compose up -d postgres redis typesense minio pgadmin

echo.
echo Waiting for services to be healthy...
timeout /t 10 /nobreak >nul

echo.
echo Starting microservices...
docker-compose up -d api-gateway auth-service user-service payment-service notification-service media-service ecommerce-service logistics-service jobtap-service search-service website-service admin-service

echo.
echo ================================
echo All services started!
echo ================================
echo.
echo Access points:
echo - API Gateway: http://localhost:3000
echo - pgAdmin: http://localhost:5050
echo - MinIO Console: http://localhost:9001
echo.
echo View logs: docker-compose logs -f
echo Stop services: docker-compose down
echo.
pause
