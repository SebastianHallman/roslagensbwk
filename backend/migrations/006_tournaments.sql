CREATE TABLE IF NOT EXISTS `tournaments` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `description` MEDIUMTEXT CHARACTER SET utf8mb4 NOT NULL,
    `status` ENUM('draft', 'published') NOT NULL DEFAULT 'draft'
);
