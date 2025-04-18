import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Chat",
    },
    sender: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    content: {
      type: String,
      trim: true,
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'document', 'video'],
      default: 'text'
    },
    file: {
      data: String, // base64 encoded file data
      originalname: String,
      mimetype: String,
      size: Number,
      thumbnail: String, // for video thumbnails
    },
    readBy: [{
      type: Schema.Types.ObjectId,
      ref: "User",
    }],
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  { timestamps: true }
);

messageSchema.pre('save', function(next) {
  // Check if file exists and has a mimetype property
  if (this.file && this.file.mimetype) {
    if (this.file.mimetype.startsWith('image/')) {
      this.messageType = 'image';
    } else if (this.file.mimetype.startsWith('video/')) {
      this.messageType = 'video';
    } else {
      this.messageType = 'document';
    }
  } else {
    // If no file or mimetype, set to default text
    this.messageType = 'text';
  }
  next();
});

export const Message = mongoose.model("Message", messageSchema);
