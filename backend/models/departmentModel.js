const db = require("../config/db");

exports.getAll = () => {
  return db
    .promise()
    .query(
      `SELECT d.*, dv.name as division_name FROM departments d LEFT JOIN divisions dv ON d.division_id = dv.id`,
    );
};

exports.getByDivisionId = (divisionId) => {
  return db
    .promise()
    .query(
      `SELECT d.*, dv.name as division_name FROM departments d LEFT JOIN divisions dv ON d.division_id = dv.id WHERE d.division_id = ?`,
      [divisionId],
    );
};

exports.create = (data) =>
  db.promise().query("INSERT INTO departments SET ?", data);

exports.update = (id, data) =>
  db.promise().query("UPDATE departments SET ? WHERE id=?", [data, id]);

exports.delete = (id) =>
  db.promise().query("DELETE FROM departments WHERE id=?", [id]);

// Check if department is in use
exports.getReferenceCount = async (id) => {
  const [users] = await db.promise().query(
    "SELECT COUNT(*) as count FROM users WHERE department_id = ?",
    [id]
  );
  return {
    exists: true,
    referenceCount: users[0]?.count || 0,
    canDelete: (users[0]?.count || 0) === 0,
  };
};
