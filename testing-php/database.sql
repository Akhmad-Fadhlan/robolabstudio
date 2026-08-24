-- ============================================
-- DATABASE: robolab_testing
-- Aplikasi Testing PHP Simple dengan MySQL
-- ============================================

CREATE DATABASE IF NOT EXISTS robolab_testing
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE robolab_testing;

-- Table: mahasiswa
CREATE TABLE IF NOT EXISTS mahasiswa (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nim         VARCHAR(20)  NOT NULL UNIQUE,
  nama        VARCHAR(100) NOT NULL,
  jurusan     VARCHAR(100) NOT NULL,
  angkatan    YEAR        NOT NULL,
  email       VARCHAR(150) NOT NULL,
  no_hp       VARCHAR(20)  DEFAULT NULL,
  ipk         DECIMAL(3,2) DEFAULT 0.00,
  status      ENUM('Aktif','Cuti','Lulus','DO') DEFAULT 'Aktif',
  created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample Data
INSERT INTO mahasiswa (nim, nama, jurusan, angkatan, email, no_hp, ipk, status) VALUES
('2021001', 'Aldi Firmansyah',    'Teknik Informatika', 2021, 'aldi@mail.com',   '081234567890', 3.75, 'Aktif'),
('2021002', 'Siti Rahayu',        'Sistem Informasi',   2021, 'siti@mail.com',   '082345678901', 3.90, 'Aktif'),
('2021003', 'Budi Santoso',       'Teknik Elektro',     2021, 'budi@mail.com',   '083456789012', 3.20, 'Aktif'),
('2020001', 'Dewi Lestari',       'Teknik Informatika', 2020, 'dewi@mail.com',   '084567890123', 3.85, 'Aktif'),
('2020002', 'Rizky Pratama',      'Manajemen Informatika', 2020, 'rizky@mail.com','085678901234', 3.10, 'Cuti'),
('2019001', 'Anisa Putri',        'Teknik Informatika', 2019, 'anisa@mail.com',  '086789012345', 3.95, 'Lulus'),
('2022001', 'Muhammad Fadhlan',   'Teknik Informatika', 2022, 'fadhlan@mail.com','087890123456', 3.60, 'Aktif'),
('2022002', 'Laila Nurhayati',    'Sistem Informasi',   2022, 'laila@mail.com',  '088901234567', 3.80, 'Aktif');
