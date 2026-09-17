-- =====================================================================
-- Baza danych: inwentarz
-- Silnik: MySQL / MariaDB (XAMPP)
-- Import: phpMyAdmin -> Import -> wybierz ten plik -> Wykonaj
--         albo w konsoli: mysql -u root -p < inwentarz.sql
-- =====================================================================

DROP DATABASE IF EXISTS `inwentarz`;
CREATE DATABASE `inwentarz`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
USE `inwentarz`;

-- ---------------------------------------------------------------------
-- Tabele slownikowe
-- ---------------------------------------------------------------------

CREATE TABLE `user_role` (
    `id`   INT AUTO_INCREMENT PRIMARY KEY,
    `role` VARCHAR(20) NOT NULL,
    UNIQUE KEY `uq_user_role_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `item_status` (
    `id`   INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(30) NOT NULL,
    UNIQUE KEY `uq_item_status_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `audit_action` (
    `id`   INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(50) NOT NULL,
    UNIQUE KEY `uq_audit_action_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `location` (
    `id`       INT AUTO_INCREMENT PRIMARY KEY,
    `building` VARCHAR(50) NOT NULL,
    `room`     VARCHAR(20) NOT NULL,
    UNIQUE KEY `uq_location_building_room` (`building`, `room`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Uzytkownicy
-- ---------------------------------------------------------------------

CREATE TABLE `user` (
    `id`            INT AUTO_INCREMENT PRIMARY KEY,
    `role_id`       INT NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    KEY `idx_user_role` (`role_id`),
    CONSTRAINT `fk_user_role`
        FOREIGN KEY (`role_id`) REFERENCES `user_role` (`id`)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Sprzet
-- ---------------------------------------------------------------------

CREATE TABLE `item` (
    `id`               INT AUTO_INCREMENT PRIMARY KEY,
    `inventory_number` VARCHAR(100) NOT NULL,
    `manufacturer`     VARCHAR(100) DEFAULT NULL,
    `model`            VARCHAR(100) DEFAULT NULL,
    `purchase_date`    DATE DEFAULT NULL,
    `purchase_price`   DECIMAL(10,2) DEFAULT NULL,
    `location_id`      INT DEFAULT NULL,
    `status_id`        INT NOT NULL DEFAULT 1,
    `assigned_to`      INT DEFAULT NULL,
    UNIQUE KEY `uq_item_inventory_number` (`inventory_number`),
    KEY `idx_item_status` (`status_id`),
    KEY `idx_item_location` (`location_id`),
    KEY `idx_item_assigned_to` (`assigned_to`),
    CONSTRAINT `fk_item_status`
        FOREIGN KEY (`status_id`) REFERENCES `item_status` (`id`)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT `fk_item_location`
        FOREIGN KEY (`location_id`) REFERENCES `location` (`id`)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT `fk_item_user`
        FOREIGN KEY (`assigned_to`) REFERENCES `user` (`id`)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Dziennik zdarzen
-- ---------------------------------------------------------------------

CREATE TABLE `audit_log` (
    `id`         INT AUTO_INCREMENT PRIMARY KEY,
    `item_id`    INT DEFAULT NULL,
    `user_id`    INT NOT NULL,
    `action_id`  INT NOT NULL,
    `details`    TEXT DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY `idx_audit_item` (`item_id`, `created_at`),
    KEY `idx_audit_user` (`user_id`),
    KEY `idx_audit_action` (`action_id`),
    CONSTRAINT `fk_audit_item`
        FOREIGN KEY (`item_id`) REFERENCES `item` (`id`)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT `fk_audit_user`
        FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT `fk_audit_action`
        FOREIGN KEY (`action_id`) REFERENCES `audit_action` (`id`)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- Dane slownikowe
-- Uwaga: item.status_id ma DEFAULT 1, wiec rekord o id = 1 musi istniec
--        i powinien oznaczac status domyslny ('active').
-- =====================================================================

INSERT INTO `item_status` (`id`, `name`) VALUES
    (1, 'active'),
    (2, 'in_repair'),
    (3, 'in_storage'),
    (4, 'retired'),
    (5, 'lost');

INSERT INTO `user_role` (`id`, `role`) VALUES
    (1, 'admin'),
    (2, 'manager'),
    (3, 'user');

INSERT INTO `location` (`id`, `building`, `room`) VALUES
    (1, 'Budynek A', '101'),
    (2, 'Budynek A', '203'),
    (3, 'Budynek B', 'Magazyn');

INSERT INTO `audit_action` (`id`, `name`) VALUES
    (1, 'create'),
    (2, 'update'),
    (3, 'delete'),
    (4, 'assign'),
    (5, 'return'),
    (6, 'status_change'),
    (7, 'login');

-- =====================================================================
-- Dane przykladowe (opcjonalne - mozesz usunac ta sekcje)
-- Hasla to hashe bcrypt dla ciagu: haslo123
-- =====================================================================

INSERT INTO `user` (`id`, `role_id`, `password_hash`) VALUES
    (1, 1, '$2y$10$e0NRzQ7VQKZ8YQ4XqjKZ8eKq5qZ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z'),
    (2, 2, '$2y$10$e0NRzQ7VQKZ8YQ4XqjKZ8eKq5qZ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z'),
    (3, 3, '$2y$10$e0NRzQ7VQKZ8YQ4XqjKZ8eKq5qZ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z');

INSERT INTO `item`
    (`inventory_number`, `manufacturer`, `model`, `purchase_date`,
     `purchase_price`, `location_id`, `status_id`, `assigned_to`) VALUES
    ('INV-2024-001', 'Dell',    'Latitude 5540',    '2024-03-12', 4899.00, 1, 1, 3),
    ('INV-2024-002', 'HP',      'LaserJet M404dn',  '2024-05-20', 1299.00, 1, 1, NULL),
    ('INV-2023-017', 'Lenovo',  'ThinkPad T14',     '2023-11-04', 5450.00, 3, 3, NULL),
    ('INV-2022-009', 'Samsung', 'S24R350',          '2022-06-30',  699.00, 2, 2, NULL);

INSERT INTO `audit_log` (`item_id`, `user_id`, `action_id`, `details`) VALUES
    (1, 1, 1, 'Dodano sprzet do ewidencji'),
    (1, 1, 4, 'Przypisano do uzytkownika o id 3'),
    (4, 2, 6, 'Zmiana statusu: active -> in_repair');
