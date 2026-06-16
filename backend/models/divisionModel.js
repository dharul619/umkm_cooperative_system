const db = require("../config/db");

exports.getAll = () => db.promise().query("SELECT * FROM divisions");

exports.create = (data) =>
  db.promise().query("INSERT INTO divisions SET ?", data);

exports.update = (id, data) =>
  db.promise().query("UPDATE divisions SET ? WHERE id=?", [data, id]);

exports.delete = (id) =>
  db.promise().query("DELETE FROM divisions WHERE id=?", [id]);
