ALTER TABLE admin_email_whitelist
    ADD COLUMN invitation_token_hash
        CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
    ADD COLUMN invitation_expires_at DATETIME NULL;