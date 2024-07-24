const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  createdBy: { type: String, required: true },
  currentUser: { type: String, required: true },
  assignTo: { type: String, required: true },
  priority: { type: String, enum: ["Low", "Medium", "High"], required: true },
  dueDate: { type: Date, required: true },
  reminder: {
    frequency: {
      type: String,
      enum: ["Daily", "Weekly", "Monthly"],
    },
    startDate: { type: Date },
  },
  status: {
    type: String,
    enum: ["Open", "In Progress", "Completed"],
    default: "Open",
  },
  transfer: {
    fromWhom: { type: String },
    reasonToTransfer: { type: String },
  },
  attachments: [
    {
      type: { type: String, enum: ["application", "image", "pdf"] },
      path: { type: String },
    },
  ],
  isDelay: {
    type: Boolean,
    default: false,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  closedAt: { type: Date, default: null },

  statusChanges: [
    {
      status: {
        type: String,
        enum: ["Open", "In Progress", "Completed"],
        required: true,
      },
      reason: { type: String, required: true },
      updatedTaskBy: { type: String },
      changesAttachments: [
        {
          type: { type: String, enum: ["application", "image", "pdf"] },
          path: { type: String },
        },
      ],
      changedAt: { type: Date, default: Date.now },
    },
  ],
});

taskSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Task", taskSchema);
