/**
 * Global error handling middleware
 * Handles all errors thrown in the application
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error('Error:', err);

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    const message = err.errors.map(e => e.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0]?.path || 'field';
    const message = `${field} already exists`;
    error = { message, statusCode: 400 };
  }

  // Sequelize foreign key constraint error
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    const message = 'Invalid reference to related resource';
    error = { message, statusCode: 400 };
  }

  // Sequelize database connection error
  if (err.name === 'SequelizeConnectionError') {
    const message = 'Database connection error';
    error = { message, statusCode: 503 };
  }

  // Sequelize record not found
  if (err.name === 'SequelizeEmptyResultError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // MySQL duplicate entry error
  if (err.code === 'ER_DUP_ENTRY') {
    const field = err.sqlMessage?.match(/for key '(.+?)'/)?.[1] || 'field';
    const message = `${field} already exists`;
    error = { message, statusCode: 400 };
  }

  // Default error response
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;

