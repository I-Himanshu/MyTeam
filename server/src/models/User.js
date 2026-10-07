import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

/** bcrypt cost factor (ARCHITECTURE §5 requires salt rounds >= 10). */
const SALT_ROUNDS = 10;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never include password in query results by default
    },
    passwordResetToken: {
      type: String,
      select: false, // Never include reset token in query results by default
    },
    passwordResetExpires: {
      type: Date,
      select: false, // Never include reset expiry in query results by default
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt
    toJSON: {
      // Serialization must never leak the password hash or __v.
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Hash the password only when it is new or modified — never re-hash an
// existing hash when unrelated fields are updated.
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

/**
 * Compare a plaintext candidate against the stored bcrypt hash.
 *
 * @param {string} plainPassword Plaintext password candidate.
 * @returns {Promise<boolean>} True when the candidate matches.
 */
userSchema.methods.matchPassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
