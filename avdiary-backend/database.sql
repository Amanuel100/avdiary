-- AvDiary Database Setup
-- Create the database (if not exists)
CREATE DATABASE IF NOT EXISTS avdiary CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE avdiary;

-- 1. Users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NULL COMMENT 'NULL for Google OAuth users',
  image VARCHAR(500) NULL,
  role ENUM('user','admin') DEFAULT 'user',
  subscription_tier VARCHAR(20) DEFAULT 'free',
  subscription_expiry DATETIME NULL,
  referral_code VARCHAR(7) UNIQUE,
  points INT DEFAULT 0,
  referred_by INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (referred_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 2. Trades table
CREATE TABLE trades (
  id VARCHAR(36) PRIMARY KEY,
  user_id INT NOT NULL,
  pair VARCHAR(10) NOT NULL,
  position ENUM('BUY','SELL') NOT NULL,
  pnl DECIMAL(10,2) DEFAULT 0,
  session VARCHAR(50),
  date DATETIME NOT NULL,
  start_time DATETIME,
  end_time DATETIME,
  tradingview_url VARCHAR(500),
  screenshot_url VARCHAR(500),
  influence VARCHAR(255),
  emotion VARCHAR(50),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_trades_user ON trades(user_id);
CREATE INDEX idx_trades_date ON trades(date);

-- 3. Messages table
CREATE TABLE messages (
  id VARCHAR(36) PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('ai','admin') NOT NULL DEFAULT 'ai',
  content TEXT NOT NULL,
  `read` TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_messages_user ON messages(user_id);

-- 4. Payments table
CREATE TABLE payments (
  id VARCHAR(36) PRIMARY KEY,
  user_id INT NOT NULL,
  plan VARCHAR(20) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  transaction_id VARCHAR(100) NOT NULL,
  screenshot_url VARCHAR(500) NULL,
  status ENUM('pending','confirmed','rejected') DEFAULT 'pending',
  admin_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);

-- 5. Insert admin user (password: aman922423 hashed with bcrypt 12 rounds)
INSERT INTO users (name, email, password, role) 
VALUES ('Admin', 'amanjob', '$2a$12$sO0ZgL0b5w1Wv4Uv2B4vOuEJ2j5ZL0oFEWK0Kq4eDf6QcGt9Aa1hq', 'admin');













--below is one by one 
ALTER TABLE users MODIFY COLUMN image MEDIUMTEXT;


CREATE TABLE calendar_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_date DATE NOT NULL,                -- Ethiopian date (EAT)
  event_time TIME NOT NULL,                -- Ethiopian time (EAT, e.g. '03:30:00')
  currency VARCHAR(10) NOT NULL,
  event VARCHAR(255) NOT NULL,
  impact ENUM('high','medium','low') NOT NULL DEFAULT 'low',
  actual VARCHAR(20) DEFAULT NULL,
  forecast VARCHAR(20) DEFAULT NULL,
  previous VARCHAR(20) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;


CREATE TABLE IF NOT EXISTS password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


ALTER TABLE trades ADD COLUMN rr INT DEFAULT NULL AFTER pnl;

