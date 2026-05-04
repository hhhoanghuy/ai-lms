const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  assignments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Assignment' }],
  inviteCode: { type: String, unique: true, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Classroom', classroomSchema);
