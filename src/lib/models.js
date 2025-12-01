import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  ipAddress: {
    type: String,
    default: null
  },
  hasSpun: {
    type: Boolean,
    default: false
  },
  registeredAt: {
    type: Date,
    default: Date.now
  }
})

const prizeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  color: {
    type: String,
    required: true
  },
  probability: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
})

const spinResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  prizeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prize',
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  spinTime: {
    type: Date,
    default: Date.now
  },
  isAssigned: {
    type: Boolean,
    default: false
  }
})

const User = mongoose.models.User || mongoose.model('User', userSchema)
const Prize = mongoose.models.Prize || mongoose.model('Prize', prizeSchema)
const SpinResult = mongoose.models.SpinResult || mongoose.model('SpinResult', spinResultSchema)

export { User, Prize, SpinResult }