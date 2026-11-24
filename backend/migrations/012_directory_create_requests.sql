CREATE TABLE directory_create_requests (
    entry_type ENUM('team', 'sponsor') NOT NULL,
    request_id BINARY(16) NOT NULL,
    payload_hash BINARY(32) NOT NULL,
    entry_id INT UNSIGNED NULL,
    PRIMARY KEY (entry_type, request_id)
) ENGINE=InnoDB;
