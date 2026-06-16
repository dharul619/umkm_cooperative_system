const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  try {
    const {
      name,
      phone_number,
      username,
      password,
      division_id,
      department_id,
    } = req.body;

    if (
      !name ||
      !phone_number ||
      !username ||
      !password ||
      !division_id ||
      !department_id
    ) {
      return res.status(400).json({
        message:
          "name, phone_number, username, password, division_id, and department_id are required",
      });
    }

    const [existingUsers] = await db
      .promise()
      .query("SELECT id FROM users WHERE username = ?", [username]);

    if (existingUsers.length > 0) {
      return res.status(409).json({ message: "Username already exists" });
    }

    const [divisionCheck] = await db
      .promise()
      .query("SELECT id FROM divisions WHERE id = ?", [division_id]);

    if (divisionCheck.length === 0) {
      return res.status(400).json({ message: "Invalid division" });
    }

    const [deptCheck] = await db
      .promise()
      .query("SELECT id, division_id FROM departments WHERE id = ?", [
        department_id,
      ]);

    if (deptCheck.length === 0) {
      return res.status(400).json({ message: "Invalid department" });
    }

    if (Number(deptCheck[0].division_id) !== Number(division_id)) {
      return res.status(400).json({
        message: "Department does not belong to the selected division",
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    await db.promise().query("INSERT INTO users SET ?", {
      name,
      phone_number,
      username,
      password: hashed,
      role_id: 4,
      division_id,
      department_id,
      status: "pending",
    });

    res.json({ message: "Register success, waiting for admin approval" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "username and password are required" });
    }

    const [rows] = await db
      .promise()
      .query(
        `SELECT u.*, r.role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE username=?`,
        [username],
      );
    const user = rows[0];
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.status !== "approved") {
      return res.status(403).json({ message: "User not approved" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Wrong password" });

    const userPayload = {
      id: user.id,
      name: user.name,
      phone_number: user.phone_number,
      username: user.username,
      role_name: user.role_name,
    };

    const token = jwt.sign(
      userPayload,
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.json({ token, user: userPayload });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
