const { Sequelize } = require('sequelize');

/**
 * MySQL Database Connection
 * Uses Sequelize ORM to connect to MySQL database
 */
const sequelize = new Sequelize(
  process.env.DB_NAME || 'smartchargingstation_mvp',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: false, // Disable automatic timestamps (using created_at from SQL)
      underscored: true, // Use snake_case for column names
      freezeTableName: true // Don't pluralize table names
    }
  }
);

/**
 * Test database connection
 */
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL Connected successfully');
    
    // Sync models (optional - set to false in production)
    if (process.env.NODE_ENV === 'development') {
      // await sequelize.sync({ alter: true }); // Uncomment to sync models
    }
    
  } catch (error) {
    console.error('Error connecting to MySQL:', error.message);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await sequelize.close();
  console.log('MySQL connection closed through app termination');
  process.exit(0);
});

module.exports = { sequelize, connectDB };

