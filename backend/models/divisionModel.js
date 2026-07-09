const db = require("../config/db");

exports.getAll = () => db.promise().query("SELECT * FROM divisions");

exports.create = (data) =>
  db.promise().query("INSERT INTO divisions SET ?", data);

exports.update = (id, data) =>
  db.promise().query("UPDATE divisions SET ? WHERE id=?", [data, id]);

exports.delete = (id) =>
  db.promise().query("DELETE FROM divisions WHERE id=?", [id]);

// Check if division is in use
exports.getReferenceCount = async (id) => {
  const [users] = await db.promise().query(
    "SELECT COUNT(*) as count FROM users WHERE division_id = ?",
    [id]
  );
  return {
    exists: true,
    referenceCount: users[0]?.count || 0,
    canDelete: (users[0]?.count || 0) === 0,
  };
};
