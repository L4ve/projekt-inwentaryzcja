-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Wrz 10, 2026 at 09:22 AM
-- Wersja serwera: 10.4.32-MariaDB
-- Wersja PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `inventory_db`
--

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `audit_log`
--

CREATE TABLE `audit_log` (
  `id` int(11) NOT NULL,
  `item_id` int(11) DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  `action` varchar(50) NOT NULL,
  `details` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `audit_log`
--

INSERT INTO `audit_log` (`id`, `item_id`, `user_id`, `action`, `details`, `created_at`) VALUES
(1, 1, 1, 'CREATE', 'Dodano laptop Dell Latitude 5520', '2026-09-10 06:43:29'),
(2, 1, 1, 'ASSIGN', 'Przypisano laptop użytkownikowi', '2026-09-10 06:43:29'),
(3, 2, 2, 'CREATE', 'Dodano laptop Lenovo ThinkPad E14', '2026-09-10 06:43:29'),
(4, 2, 2, 'ASSIGN', 'Przypisano laptop użytkownikowi', '2026-09-10 06:43:29'),
(5, 3, 1, 'CREATE', 'Dodano monitor Samsung', '2026-09-10 06:43:29'),
(6, 5, 3, 'CREATE', 'Dodano drukarkę HP', '2026-09-10 06:43:29'),
(7, 7, 1, 'STATUS_CHANGE', 'Sprzęt przekazano do serwisu', '2026-09-10 06:43:29'),
(8, 8, 5, 'ASSIGN', 'Przypisano telefon użytkownikowi', '2026-09-10 06:43:29'),
(9, 9, 4, 'CREATE', 'Dodano MacBook Air M2', '2026-09-10 06:43:29'),
(10, 6, 1, 'STATUS_CHANGE', 'Laptop oznaczono jako dostępny', '2026-09-10 06:43:29');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `item`
--

CREATE TABLE `item` (
  `id` int(11) NOT NULL,
  `inventory_number` varchar(100) NOT NULL,
  `manufacturer` varchar(100) DEFAULT NULL,
  `model` varchar(100) DEFAULT NULL,
  `purchase_date` date DEFAULT NULL,
  `purchase_price` decimal(10,2) DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL,
  `status` varchar(30) DEFAULT NULL,
  `assigned_to` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `item`
--

INSERT INTO `item` (`id`, `inventory_number`, `manufacturer`, `model`, `purchase_date`, `purchase_price`, `location`, `status`, `assigned_to`) VALUES
(1, 'LAP-001', 'Dell', 'Latitude 5520', '2023-01-15', 3200.00, 'Biuro 101', 'active', 1),
(2, 'LAP-002', 'Lenovo', 'ThinkPad E14', '2023-03-20', 2900.00, 'Biuro 102', 'active', 2),
(3, 'MON-001', 'Samsung', 'S24R350', '2022-11-10', 850.00, 'Biuro 101', 'active', 1),
(4, 'MON-002', 'LG', '24MP60G', '2022-12-05', 900.00, 'Biuro 102', 'active', 2),
(5, 'PRN-001', 'HP', 'LaserJet Pro M404dn', '2021-06-12', 1250.00, 'Sekretariat', 'active', 3),
(6, 'LAP-003', 'HP', 'ProBook 450 G8', '2021-09-25', 3100.00, 'Magazyn', 'available', NULL),
(7, 'LAP-004', 'Acer', 'TravelMate P2', '2020-04-18', 2400.00, 'Magazyn', 'repair', NULL),
(8, 'PHN-001', 'Samsung', 'Galaxy S23', '2023-05-08', 3600.00, 'Biuro 103', 'active', 5),
(9, 'LAP-005', 'Apple', 'MacBook Air M2', '2023-08-22', 5200.00, 'Biuro 104', 'active', 4),
(10, 'MON-003', 'Dell', 'P2422H', '2023-02-14', 1100.00, 'Biuro 103', 'available', NULL);

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `user`
--

CREATE TABLE `user` (
  `id` int(11) NOT NULL,
  `role` varchar(20) NOT NULL,
  `password_hash` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`id`, `role`, `password_hash`) VALUES
(1, 'admin', 'admin123'),
(2, 'admin', 'admin456'),
(3, 'moderator', 'moderator123'),
(4, 'user', 'user123'),
(5, 'user', 'user456'),
(6, 'user', 'user789');

--
-- Indeksy dla zrzutów tabel
--

--
-- Indeksy dla tabeli `audit_log`
--
ALTER TABLE `audit_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_audit_item` (`item_id`),
  ADD KEY `fk_audit_user` (`user_id`);

--
-- Indeksy dla tabeli `item`
--
ALTER TABLE `item`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `inventory_number` (`inventory_number`),
  ADD KEY `fk_item_user` (`assigned_to`);

--
-- Indeksy dla tabeli `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `audit_log`
--
ALTER TABLE `audit_log`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `item`
--
ALTER TABLE `item`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `audit_log`
--
ALTER TABLE `audit_log`
  ADD CONSTRAINT `fk_audit_item` FOREIGN KEY (`item_id`) REFERENCES `item` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `item`
--
ALTER TABLE `item`
  ADD CONSTRAINT `fk_item_user` FOREIGN KEY (`assigned_to`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
