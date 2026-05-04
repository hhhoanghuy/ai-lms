const Classroom = require('../models/Classroom');
const crypto = require('crypto');

// Create Classroom (Teacher only)
const createClassroom = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    // Generate unique 6-character invite code
    let inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase();
    
    // Check if code exists (rare, but good for safety)
    let exists = await Classroom.findOne({ inviteCode });
    while (exists) {
      inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase();
      exists = await Classroom.findOne({ inviteCode });
    }

    const classroom = await Classroom.create({
      name,
      description,
      teacher: req.user._id,
      inviteCode
    });

    res.status(201).json(classroom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Join Classroom via Invite Code (Student only)
const joinClassroom = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const classroom = await Classroom.findOne({ inviteCode });

    if (!classroom) return res.status(404).json({ message: 'Mã lớp học không hợp lệ' });

    // Check if already in class
    if (classroom.students.includes(req.user._id)) {
      return res.status(400).json({ message: 'Bạn đã tham gia lớp học này rồi' });
    }

    classroom.students.push(req.user._id);
    await classroom.save();

    res.json({ message: `Đã tham gia lớp ${classroom.name} thành công`, classroom });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get My Classrooms (Teacher sees their classes, Student sees joined classes)
const getMyClassrooms = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'teacher') {
      query = { teacher: req.user._id };
    } else {
      query = { students: req.user._id };
    }

    const classrooms = await Classroom.find(query).populate('teacher', 'name email');
    res.json(classrooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Classroom Details (Include assignments and students)
const getClassroomDetails = async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id)
      .populate('teacher', 'name email')
      .populate('students', 'name email')
      .populate({
        path: 'assignments',
        options: { sort: { deadline: 1 } }
      });

    if (!classroom) return res.status(404).json({ message: 'Không tìm thấy lớp học' });

    // Ensure user is part of the class
    const isTeacher = classroom.teacher._id.toString() === req.user._id.toString();
    const isStudent = classroom.students.some(s => s._id.toString() === req.user._id.toString());

    if (!isTeacher && !isStudent) {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập lớp học này' });
    }

    res.json(classroom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createClassroom,
  joinClassroom,
  getMyClassrooms,
  getClassroomDetails
};
