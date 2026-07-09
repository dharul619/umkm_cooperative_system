const db = require("../config/db");

exports.getAll = () => {
  return db.promise().query("SELECT * FROM roles");
};

exports.create = (data) => {
  return db.promise().query("INSERT INTO roles SET ?", data);
};

exports.update = (id, data) => {
  return db.promise().query("UPDATE roles SET ? WHERE id=?", [data, id]);
};

exports.delete = (id) => {
  return db.promise().query("DELETE FROM roles WHERE id=?", [id]);
};

// Check if role is in use
exports.getReferenceCount = async (id) => {
  const [users] = await db.promise().query(
    "SELECT COUNT(*) as count FROM users WHERE role_id = ?",
    [id]
  );
  return {
    exists: true,
    referenceCount: users[0]?.count || 0,
    canDelete: (users[0]?.count || 0) === 0,
  };
};
