import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { UnRegisteredUser } from "../models/unRegisteredUser.model.js";
import { generateJWTToken_username } from "../utils/generateJWTToken.js";
import { Message } from "../models/message.model.js";
import { Chat } from "../models/chat.model.js";
import { v2 as cloudinary } from "cloudinary";
import { safeUnlink } from "../utils/fileUtils.js";
import { getFileStream } from "../utils/gridfs.js";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const sendMessage = asyncHandler(async (req, res) => {
  console.log("\n******** Inside sendMessage Controller function ********");

  const { chatId, content } = req.body;
  const file = req.file;

  if (!chatId || (!content && !file)) {
    throw new ApiError(400, "Please provide message content or file");
  }

  const sender = req.user._id;

  const check = await Chat.findOne({ _id: chatId });
  if (!check.users.includes(sender)) {
    throw new ApiError(400, "Chat is not approved");
  }

  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new ApiError(400, "Chat not found");
  }

  let fileData = null;
  if (file) {
    // Convert file to base64
    const fileBuffer = file.buffer;
    const base64Data = fileBuffer.toString('base64');
    
    fileData = {
      data: base64Data,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    };
  }

  var message = await Message.create({
    chatId: chatId,
    sender: sender,
    content: content || "",
    file: fileData,
  });

  message = await message.populate("sender", "username name email picture");
  message = await message.populate("chatId");

  message = await User.populate(message, {
    path: "chatId.users",
    select: "username name email picture",
  });

  await Chat.findByIdAndUpdate(
    { _id: chatId },
    {
      latestMessage: message,
    }
  );

  return res.status(201).json(new ApiResponse(201, message, "Message sent successfully"));
});

export const getMessages = asyncHandler(async (req, res) => {
  console.log("\n******** Inside getMessages Controller function ********");

  const chatId = req.params.chatId;

  const messages = await Message.find({ chatId: chatId })
    .populate("sender", "username name email picture chatId")
    .sort({ createdAt: 1 });

  return res.status(200).json(new ApiResponse(200, messages, "Messages fetched successfully"));
});

export const downloadFile = asyncHandler(async (req, res) => {
  const filename = req.params.filename;
  
  try {
    const fileStream = await getFileStream(filename);
    fileStream.pipe(res);
  } catch (error) {
    throw new ApiError(404, "File not found");
  }
});
