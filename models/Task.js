const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String },
  assignTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
  dueDate: { type: Date },
  reminder: { type: Date },
  status: { type: String, enum: ['Open', 'In Progress', 'Completed'], required: true },
  statusChangeReason: { type: String },
  attachments: [
    {
      type: { type: String, enum: ['voice', 'image', 'pdf'] },
      path: { type: String }
    }
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

taskSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Task', taskSchema);
