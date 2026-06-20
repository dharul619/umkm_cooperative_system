require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/api/roles", require("./backend/routes/roleRoutes"));
app.use("/api/divisions", require("./backend/routes/divisionRoutes"));
app.use("/api/departments", require("./backend/routes/departmentRoutes"));
app.use("/api/vendors", require("./backend/routes/vendorRoutes"));
app.use("/api/menus", require("./backend/routes/menuRoutes"));
app.use("/api/jastip", require("./backend/routes/jastipRoutes"));
app.use("/api/payments", require("./backend/routes/paymentRoutes"));
app.use("/api/users", require("./backend/routes/userRoutes"));
app.use("/api/auth", require("./backend/routes/authRoutes"));
app.use("/api/categories", require("./backend/routes/categoryRoutes"));
app.use("/api/subcategories", require("./backend/routes/subcategoryRoutes"));
app.use("/api/brands", require("./backend/routes/brandRoutes"));
app.use("/api/products", require("./backend/routes/productRoutes"));
app.use("/api/suppliers", require("./backend/routes/supplierRoutes"));
app.use("/api/purchases", require("./backend/routes/purchaseRoutes"));

app.listen(port, () => console.log(`Server running on ${port}`));


