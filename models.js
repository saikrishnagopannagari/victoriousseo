const sequelize = require("./db.js");
const initModels = require("./models/init-models");
const models = initModels(sequelize);

module.exports = models;
