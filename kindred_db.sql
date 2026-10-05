-- ========================================================
-- Kindred Volunteer Management Platform - MySQL Database Schema
-- Compatible with XAMPP MySQL / MariaDB (Default: localhost:3306)
-- ========================================================

CREATE DATABASE IF NOT EXISTS `kindred_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `kindred_db`;

-- Drop tables in reverse order of foreign keys
DROP TABLE IF EXISTS `discussions`;
DROP TABLE IF EXISTS `announcements`;
DROP TABLE IF EXISTS `resources`;
DROP TABLE IF EXISTS `signups`;
DROP TABLE IF EXISTS `shift_roles`;
DROP TABLE IF EXISTS `shifts`;
DROP TABLE IF EXISTS `events`;
DROP TABLE IF EXISTS `users`;

-- 1. USERS TABLE (Volunteers and Admins)
CREATE TABLE `users` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `role` ENUM('admin', 'volunteer') NOT NULL DEFAULT 'volunteer',
  `avatar` TEXT DEFAULT NULL,
  `emergency_name` VARCHAR(150) DEFAULT NULL,
  `emergency_phone` VARCHAR(50) DEFAULT NULL,
  `emergency_relation` VARCHAR(50) DEFAULT NULL,
  `skills` TEXT DEFAULT NULL,
  `total_hours_logged` DECIMAL(6, 1) NOT NULL DEFAULT 0.0,
  `badges` TEXT DEFAULT NULL,
  `bio` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. EVENTS TABLE
CREATE TABLE `events` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  `location_name` VARCHAR(200) NOT NULL,
  `location_address` VARCHAR(255) NOT NULL,
  `location_map_url` TEXT DEFAULT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `status` ENUM('upcoming', 'in_progress', 'completed', 'canceled') NOT NULL DEFAULT 'upcoming',
  `organizer_name` VARCHAR(150) NOT NULL,
  `organizer_email` VARCHAR(150) NOT NULL,
  `organizer_org` VARCHAR(150) NOT NULL,
  `cover_image` TEXT DEFAULT NULL,
  `requires_verification` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. SHIFTS TABLE (Multi-slot shift scheduling)
CREATE TABLE `shifts` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `event_id` VARCHAR(50) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `start_time` VARCHAR(50) NOT NULL,
  `end_time` VARCHAR(50) NOT NULL,
  `date` DATE NOT NULL,
  `hours` DECIMAL(4, 1) NOT NULL DEFAULT 4.0,
  INDEX (`event_id`),
  FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. SHIFT ROLES TABLE (Role-based signups & headcount caps)
CREATE TABLE `shift_roles` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `shift_id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `description` TEXT NOT NULL,
  `capacity` INT NOT NULL DEFAULT 1,
  `requires_approval` BOOLEAN NOT NULL DEFAULT FALSE,
  `skills_suggested` TEXT DEFAULT NULL,
  INDEX (`shift_id`),
  FOREIGN KEY (`shift_id`) REFERENCES `shifts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. SIGNUPS TABLE (Registrations, QR Tokens & Automated Waitlists)
CREATE TABLE `signups` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `event_id` VARCHAR(50) NOT NULL,
  `shift_id` VARCHAR(50) NOT NULL,
  `role_id` VARCHAR(50) NOT NULL,
  `user_id` VARCHAR(50) NOT NULL,
  `user_name` VARCHAR(150) NOT NULL,
  `user_email` VARCHAR(150) NOT NULL,
  `user_phone` VARCHAR(50) DEFAULT NULL,
  `emergency_name` VARCHAR(150) DEFAULT NULL,
  `emergency_phone` VARCHAR(50) DEFAULT NULL,
  `emergency_relation` VARCHAR(50) DEFAULT NULL,
  `status` ENUM('confirmed', 'pending_approval', 'waitlisted', 'attended', 'no_show', 'canceled') NOT NULL DEFAULT 'confirmed',
  `waitlist_position` INT DEFAULT NULL,
  `qr_code_token` VARCHAR(100) NOT NULL UNIQUE,
  `registered_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `checked_in_at` TIMESTAMP NULL DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  INDEX (`event_id`),
  INDEX (`shift_id`),
  INDEX (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. RESOURCES TABLE (Shared Resource Hub)
CREATE TABLE `resources` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `event_id` VARCHAR(50) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `url` TEXT DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `file_size` VARCHAR(50) DEFAULT '1.5 MB PDF',
  `is_pinned` BOOLEAN NOT NULL DEFAULT FALSE,
  `uploaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (`event_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. BROADCAST ANNOUNCEMENTS TABLE
CREATE TABLE `announcements` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `event_id` VARCHAR(50) NOT NULL,
  `event_title` VARCHAR(200) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `message` TEXT NOT NULL,
  `urgency` ENUM('normal', 'urgent', 'critical') NOT NULL DEFAULT 'normal',
  `sent_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `sent_by` VARCHAR(150) NOT NULL,
  `channels` VARCHAR(100) NOT NULL DEFAULT 'in_app,email',
  INDEX (`event_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. DISCUSSION COMMENTS TABLE
CREATE TABLE `discussions` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `event_id` VARCHAR(50) NOT NULL,
  `user_id` VARCHAR(50) NOT NULL,
  `user_name` VARCHAR(150) NOT NULL,
  `user_avatar` TEXT DEFAULT NULL,
  `user_role` VARCHAR(50) NOT NULL DEFAULT 'volunteer',
  `message` TEXT NOT NULL,
  `category` VARCHAR(50) NOT NULL DEFAULT 'General',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `likes` INT NOT NULL DEFAULT 0,
  INDEX (`event_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
