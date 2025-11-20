// MySQL queries for SignData table
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS SignData (
    id VARCHAR(255) PRIMARY KEY,
    userId VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    createdAt DATETIME NOT NULL,
    signsPerformed JSON NOT NULL,
    secondsSpent INT NOT NULL
  );
`;

const insertSignDataQuery = `
  INSERT INTO SignData (id, userId, username, createdAt, signsPerformed, secondsSpent)
  VALUES (?, ?, ?, ?, ?, ?);
`;

const getSignDataByUserQuery = `
  SELECT * FROM SignData WHERE userId = ? ORDER BY createdAt DESC;
`;

const getAllSignDataQuery = `
  SELECT * FROM SignData ORDER BY createdAt DESC;
`;

module.exports = {
  createTableQuery,
  insertSignDataQuery,
  getSignDataByUserQuery,
  getAllSignDataQuery,
};
