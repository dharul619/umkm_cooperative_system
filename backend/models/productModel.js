const db = require('../config/db');

exports.getAll = () =>
  db.promise().query('SELECT p.*, s.name AS subcategory_name, b.name AS brand_name FROM products p LEFT JOIN subcategories s ON p.subcategory_id = s.id LEFT JOIN brands b ON p.brand_id = b.id ORDER BY p.name ASC');

exports.create = (data) =>
  db.promise().query('INSERT INTO products SET ?', data);

exports.update = (id, data) =>
  db.promise().query('UPDATE products SET ? WHERE id=?', [data, id]);

exports.delete = (id) =>
  db.promise().query('DELETE FROM products WHERE id=?', [id]);
