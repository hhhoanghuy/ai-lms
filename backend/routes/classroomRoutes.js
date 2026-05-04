const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createClassroom,
  joinClassroom,
  getMyClassrooms,
  getClassroomDetails
} = require('../controllers/classroomController');

// Create Classroom (Teacher only)
router.post('/', protect, authorize('teacher'), createClassroom);

// Join Classroom via Invite Code (Student only)
router.post('/join', protect, authorize('student'), joinClassroom);

// Get My Classrooms (Teacher shows classes they own, Student shows classes they are in)
router.get('/my-classrooms', protect, getMyClassrooms);

// Get Specific Classroom Details (Assignments, Students)
router.get('/:id', protect, getClassroomDetails);

module.exports = router;
