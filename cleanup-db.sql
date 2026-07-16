-- Cleanup script for database schema issues
-- Run this if you get "column token of relation sessions contains null values" error

-- Drop the elara_dev database and recreate it
DROP DATABASE IF EXISTS elara_dev;
CREATE DATABASE elara_dev;
