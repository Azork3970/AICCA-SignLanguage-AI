-- SQL script to create the database for Sign Language Recognition App
-- Run this in MySQL Workbench or any MySQL client

-- Create the database
CREATE DATABASE IF NOT EXISTS sign_language_db;

-- Use the database
USE sign_language_db;

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255), -- NULL for OAuth users
  provider ENUM('local', 'google', 'facebook') DEFAULT 'local',
  provider_id VARCHAR(255), -- OAuth provider ID
  photo_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

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
