const db = require("../config/db");

exports.getAll = () =>
  db.promise().query("SELECT * FROM vendors ORDER BY name ASC");

exports.create = (data) => db.promise().query("INSERT INTO vendors SET ?", data);

exports.update = (id, data) =>
  db.promise().query("UPDATE vendors SET ? WHERE id=?", [data, id]);

exports.delete = (id) =>
  db.promise().query("DELETE FROM vendors WHERE id=?", [id]);
