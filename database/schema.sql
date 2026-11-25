CREATE DATABASE IF NOT EXISTS todo_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE todo_db;

CREATE TABLE IF NOT EXISTS tasks (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- Change this password before running the script.
CREATE USER IF NOT EXISTS 'todo_user'@'%' IDENTIFIED BY 'change_this_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON todo_db.* TO 'todo_user'@'%';
FLUSH PRIVILEGES;
