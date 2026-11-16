CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
    `user_id` INT UNSIGNED PRIMARY KEY,
    `token_hash` CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
    `expires_at` DATETIME NOT NULL,
    CONSTRAINT `fk_password_reset_tokens_user`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4;
