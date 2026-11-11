CREATE TABLE IF NOT EXISTS `rounds` (
    `id` int AUTO_INCREMENT PRIMARY KEY,
    `tournament_id` INT UNSIGNED NOT NULL,
    `starts_at` DATETIME NOT NULL,
    `venue` VARCHAR(255) CHARACTER SET utf8mb4 NOT NULL,
    `results_url` VARCHAR(2048),
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
);