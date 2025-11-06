-- SQL script to create the database for Sign Language Recognition App
-- Run this in MySQL Workbench or any MySQL client

-- Create the database
CREATE DATABASE IF NOT EXISTS sign_language_db;

-- Use the database
USE sign_language_db;

-- The SignData table will be created automatically by the application
-- But you can create it manually if needed:
-- CREATE TABLE IF NOT EXISTS SignData (
--   id VARCHAR(255) PRIMARY KEY,
--   userId VARCHAR(255) NOT NULL,
--   username VARCHAR(255) NOT NULL,
--   createdAt DATETIME NOT NULL,
--   signsPerformed JSON NOT NULL,
--   secondsSpent INT NOT NULL
-- );
