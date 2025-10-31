-- צור מסד נתונים לדוגמה
CREATE DATABASE IF NOT EXISTS helify_cdc_demo;
USE helify_cdc_demo;

-- טבלת משתמשים
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- טבלת הזמנות
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  amount DECIMAL(10,2),
  status ENUM('pending', 'paid', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- טבלת לוגים עסקיים
CREATE TABLE audit_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  entity_type VARCHAR(50),
  entity_id INT,
  action VARCHAR(50),
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- כמה נתוני בסיס
INSERT INTO users (name, email) VALUES
('Matan Gilboa', 'matan@example.com'),
('Paz Levi', 'paz@example.com'),
('Ronen Bar', 'ronen@example.com');

INSERT INTO orders (user_id, amount, status) VALUES
(1, 150.00, 'paid'),
(2, 299.99, 'pending'),
(3, 120.00, 'cancelled');

INSERT INTO audit_log (entity_type, entity_id, action, message)
VALUES
('user', 1, 'create', 'User Matan created'),
('order', 2, 'create', 'Order 2 created for Paz'),
('order', 3, 'cancel', 'Order 3 cancelled by user');

-- הצג לסיום
SELECT * FROM users;
SELECT * FROM orders;
SELECT * FROM audit_log;
