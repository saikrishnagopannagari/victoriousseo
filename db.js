const Sequelize = require("sequelize");
const sequelize = new Sequelize("victorious", "postgres", "root", {
  host: "localhost",
  dialect: "postgres",
  password: "root",
  logging: false,
});
module.exports = sequelize;
