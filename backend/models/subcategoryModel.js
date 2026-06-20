const db = require('../config/db');

exports.getAll = () =>
  db.promise().query('SELECT s.*, c.name AS category_name FROM subcategories s LEFT JOIN categories c ON s.category_id = c.id ORDER BY s.name ASC');

exports.create = (data) =>
  db.promise().query('INSERT INTO subcategories SET ?', data);

exports.update = (id, data) =>
  db.promise().query('UPDATE subcategories SET ? WHERE id=?', [data, id]);

exports.delete = (id) =>
  db.promise().query('DELETE FROM subcategories WHERE id=?', [id]);
