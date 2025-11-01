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


-- כמה נתוני בסיס
INSERT INTO users (name, email) VALUES
('Matan Gilboa', 'matan@example.com'),
('Paz Levi', 'paz@example.com'),
('Ronen Bar', 'ronen@example.com');

-- הצג לסיום
SELECT * FROM users;
