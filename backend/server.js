const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes.js'));
app.use('/api/assignments', require('./routes/assignmentRoutes.js'));
app.use('/api/submissions', require('./routes/submissionRoutes.js'));
app.use('/api/classrooms', require('./routes/classroomRoutes.js'));
app.get('/', (req, res) => {
  res.send('AI LMS Backend API is running...');
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Database connection error:', err);
  });
