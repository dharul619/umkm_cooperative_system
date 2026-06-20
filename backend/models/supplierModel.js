const db = require('../config/db');

exports.getAll = () =>
  db.promise().query('SELECT * FROM suppliers ORDER BY name ASC');

exports.getById = (id) =>
  db.promise().query('SELECT * FROM suppliers WHERE id = ?', [id]);

exports.create = (data) =>
  db.promise().query(
    'INSERT INTO suppliers (name, phone, address, is_active) VALUES (?, ?, ?, ?)',
    [data.name, data.phone ?? null, data.address ?? null, data.is_active ?? 1]
  );

exports.update = (id, data) =>
  db.promise().query(
    'UPDATE suppliers SET name = ?, phone = ?, address = ?, is_active = ? WHERE id = ?',
    [data.name, data.phone ?? null, data.address ?? null, data.is_active ?? 1, id]
  );

exports.softDelete = (id) =>
  db.promise().query('UPDATE suppliers SET is_active = 0 WHERE id = ?', [id]);
