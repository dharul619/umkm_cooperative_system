const db = require("../config/db");

exports.getAll = () => {
  return db.promise().query(`
    SELECT
      u.id,
      u.name,
      u.phone_number,
      u.username,
      u.status,
      u.role_id,
      u.division_id,
      u.department_id,
      r.role_name,
      d.name as division,
      dept.name as department
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    LEFT JOIN divisions d ON u.division_id = d.id
    LEFT JOIN departments dept ON u.department_id = dept.id
  `);
};

exports.create = (data) => db.promise().query("INSERT INTO users SET ?", data);
exports.update = (id, data) =>
  db.promise().query("UPDATE users SET ? WHERE id=?", [data, id]);
exports.delete = (id) =>
  db.promise().query("DELETE FROM users WHERE id=?", [id]);
