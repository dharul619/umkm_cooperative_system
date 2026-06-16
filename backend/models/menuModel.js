const db = require("../config/db");

exports.getAll = () =>
  db.promise().query(
    `SELECT m.*, v.name AS vendor_name
     FROM menus m
     LEFT JOIN vendors v ON m.vendor_id = v.id
     ORDER BY m.created_at DESC, m.name ASC`,
  );

exports.create = (data) => db.promise().query("INSERT INTO menus SET ?", data);

exports.update = (id, data) =>
  db.promise().query("UPDATE menus SET ? WHERE id=?", [data, id]);

exports.delete = (id) =>
  db.promise().query("DELETE FROM menus WHERE id=?", [id]);
