const mysql = require('e:/Reac-Node-Immersive Project/SIFS/SIFS-Backend/sifs-group-api-backend-node/node_modules/mysql2/promise');
require('e:/Reac-Node-Immersive Project/SIFS/SIFS-Backend/sifs-group-api-backend-node/node_modules/dotenv').config({path: 'e:/Reac-Node-Immersive Project/SIFS/SIFS-Backend/sifs-group-api-backend-node/.env'});

async function migrate() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE_EDUCATIONANDINTERNSHIP
    });
    
    // Create student_training_bookmarks
    await connection.execute('CREATE TABLE IF NOT EXISTS student_training_bookmarks (id INT AUTO_INCREMENT PRIMARY KEY, studentID INT NOT NULL, trainingID INT NOT NULL, subjectID INT NOT NULL, losID INT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)');
    console.log('Checked/Created student_training_bookmarks');

    // Create student_training_notes
    await connection.execute('CREATE TABLE IF NOT EXISTS student_training_notes (id INT AUTO_INCREMENT PRIMARY KEY, studentID INT NOT NULL, trainingID INT NOT NULL, subjectID INT NOT NULL, losID INT NOT NULL, note TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)');
    console.log('Checked/Created student_training_notes');

    // Create student_training_complete
    await connection.execute('CREATE TABLE IF NOT EXISTS student_training_complete (id INT AUTO_INCREMENT PRIMARY KEY, studentID INT NOT NULL, trainingID INT NOT NULL, subjectID INT NOT NULL, losID INT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)');
    console.log('Checked/Created student_training_complete');

    await connection.end();
  } catch(e) {
    console.error(e);
  }
}
migrate();
