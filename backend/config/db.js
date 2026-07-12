const { Sequelize } = require('sequelize');
const path = require('path');

let sequelize;

if (process.env.DATABASE_URL) {
  console.log('Connecting to production SQL database...');
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: process.env.DATABASE_URL.includes('ssl=true') ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {}
  });
} else {
  console.log('No DATABASE_URL found in env. Initializing local SQLite database...');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '..', 'database.sqlite'),
    logging: false
  });
}

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('SQL Database Connected successfully.');
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await sequelize.close();
    console.log('Database disconnected successfully.');
  } catch (error) {
    console.error('Error disconnecting database:', error);
  }
};

module.exports = { sequelize, connectDB, disconnectDB };
