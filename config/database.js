const mysql      = require('mysql');

var connection= mysql.createPool({
  connectionLimit: 10,
    host      : process.env.host,
    user      : process.env.user,
    password  : process.env.password,
    database  : process.env.database,
    multipleStatements: true
  });

  module.exports = connection;