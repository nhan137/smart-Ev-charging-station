-- Migration: Add reset password fields to users table
-- Run this SQL to add reset_password_token and reset_password_expires columns

ALTER TABLE `users` 
ADD COLUMN `reset_password_token` VARCHAR(255) NULL DEFAULT NULL AFTER `created_at`,
ADD COLUMN `reset_password_expires` DATETIME NULL DEFAULT NULL AFTER `reset_password_token`;

-- Add index for faster lookups
CREATE INDEX `idx_reset_token` ON `users` (`reset_password_token`);

