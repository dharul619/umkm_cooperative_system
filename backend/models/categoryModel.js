const db = require('../config/db');

exports.getAll = () =>
  db.promise().query('SELECT * FROM categories ORDER BY name ASC');

exports.create = (data) =>
  db.promise().query('INSERT INTO categories SET ?', data);

exports.update = (id, data) =>
  db.promise().query('UPDATE categories SET ? WHERE id=?', [data, id]);

exports.delete = (id) =>
  db.promise().query('DELETE FROM categories WHERE id=?', [id]);
