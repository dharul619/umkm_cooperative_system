const db = require('../config/db');

exports.getAll = () =>
  db.promise().query('SELECT * FROM brands ORDER BY name ASC');

exports.create = (data) =>
  db.promise().query('INSERT INTO brands SET ?', data);

exports.update = (id, data) =>
  db.promise().query('UPDATE brands SET ? WHERE id=?', [data, id]);

exports.delete = (id) =>
  db.promise().query('DELETE FROM brands WHERE id=?', [id]);
