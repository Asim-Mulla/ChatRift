# ChatRift – Real-Time Chat Application

<https://chatrift.onrender.com>

A modern, feature-rich real-time chat application built with the MERN stack, Socket.IO, and Zustand for seamless communication.

## 🛠 Built With

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio)
![Zustand](https://img.shields.io/badge/Zustand-FF6B6B?style=for-the-badge&logo=zustand)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens)

**ChatRift** is a comprehensive real-time chat application that enables users to communicate through direct messages and group chats. Built with modern web technologies, it offers a seamless messaging experience with file sharing, emoji support, typing indicators, and robust user management features.

## Project Overview

ChatRift provides a complete messaging platform with user authentication, contact management, real-time messaging, file sharing capabilities, and group chat functionality. The application features a clean, modern interface built with shadcn/ui components and Tailwind CSS, ensuring a responsive and intuitive user experience.

## UI Previews

### Authentication & Profile

| Login/Signup Page                                                                                                                                                                                                                                                      | Profile Management                                                                                                                                                                                                                                             |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [![Login/Signup Page](https://hebbkx1anhila5yf.public.blob.vercel-storage.com/01%20Login-Signup-o7CCi1g59BYA3MHIYYxIiMeeSvjGBo.png "Login/Signup Page")](https://hebbkx1anhila5yf.public.blob.vercel-storage.com/01%20Login-Signup-o7CCi1g59BYA3MHIYYxIiMeeSvjGBo.png) | [![Profile Management](https://hebbkx1anhila5yf.public.blob.vercel-storage.com/02%20Profile-UrNfoOipkXIg1c7U702CslQDfMTTMa.png "Profile Management")](https://hebbkx1anhila5yf.public.blob.vercel-storage.com/02%20Profile-UrNfoOipkXIg1c7U702CslQDfMTTMa.png) |

### Chat Interface

| New Contact Selection                                                                                                                                                                                                                                                  | Chat with Emoji Support                                                                                                                                                                                                                                                            |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [![New Contact Selection](https://hebbkx1anhila5yf.public.blob.vercel-storage.com/04%20New%20DM-TKkwGM7Si8tPZXOuGpSXIiu8ZVLTMk.png "New Contact Selection")](https://hebbkx1anhila5yf.public.blob.vercel-storage.com/04%20New%20DM-TKkwGM7Si8tPZXOuGpSXIiu8ZVLTMk.png) | [![Chat with Emoji Support](https://hebbkx1anhila5yf.public.blob.vercel-storage.com/05%20Chat%20Emoji-yyHi6SbTsEKDtViKlqBWjmDTSFOiF6.png "Chat with Emoji Support")](https://hebbkx1anhila5yf.public.blob.vercel-storage.com/05%20Chat%20Emoji-yyHi6SbTsEKDtViKlqBWjmDTSFOiF6.png) |

### File Sharing & Message Management

| File Sharing                                                                                                                                                                                                                                                                         | Message Deletion                                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [![File Sharing](https://hebbkx1anhila5yf.public.blob.vercel-storage.com/09%20Chat%20file%20pdf%20docs-xMeHam3AegXvg2TvRY9Y1LB4s5MIH7.png "File Sharing")](https://hebbkx1anhila5yf.public.blob.vercel-storage.com/09%20Chat%20file%20pdf%20docs-xMeHam3AegXvg2TvRY9Y1LB4s5MIH7.png) | [![Message Deletion](https://hebbkx1anhila5yf.public.blob.vercel-storage.com/10%20Delete%20message-PUFLM24K7xlMY6umMkdOtYotvLLjBc.png "Message Deletion")](https://hebbkx1anhila5yf.public.blob.vercel-storage.com/10%20Delete%20message-PUFLM24K7xlMY6umMkdOtYotvLLjBc.png) |

### Group Management

| Group Editing Interface                                                                                                                                                                                                                                        |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [![Group Editing](https://hebbkx1anhila5yf.public.blob.vercel-storage.com/15%20Group%20edit-aXWKN72DJQ48JuLlgcbFwHMOUCmx2t.png "Group Editing")](https://hebbkx1anhila5yf.public.blob.vercel-storage.com/15%20Group%20edit-aXWKN72DJQ48JuLlgcbFwHMOUCmx2t.png) |

## Features

### Core Messaging Features

1. **Real-Time Communication**

   - Instant messaging with Socket.IO
   - Live typing indicators for both DMs and groups
   <!-- - Real-time message delivery and read receipts -->
   - Real-time message delivery
   - Online/offline status indicators

2. **Rich Message Support**

   - Text messages with emoji support
   - Comprehensive emoji picker with categories
   - File sharing (images, PDFs, documents, ZIP files, and more)
   - File download functionality
   <!-- - Message timestamps and delivery status -->
   - Message timestamps

3. **Contact Management**
   - Add contacts by email or name search
   - Contact list with online status
   - Easy contact discovery and management

### Direct Messaging (DM)

1. **Private Conversations**

   - One-on-one messaging
   - Message history persistence
   - Typing indicators
   - File sharing capabilities

2. **Message Control**
   - Sender can delete their own messages
   - Real-time message deletion
   <!-- - Message editing capabilities -->

### Group Chat Features

1. **Group Creation & Management**

   - Create groups with multiple members
   - Add/remove members (admin only)
   - Edit group names (admin only)
   - Leave group functionality for members

2. **Advanced Group Controls**

   - Admin privileges for group management
   - Members can delete their own messages
   - Admins can delete any message in the group
   - Real-time group updates

3. **Group Communication**
   - Multi-user conversations
   - Typing indicators for all participants
   - File sharing within groups
   - DM from group by clicking the message sender profile image

### User Experience

1. **Authentication & Security**

   - Secure user registration and login
   - JWT-based authentication
   - Password encryption with bcrypt
   - Session management

2. **Profile Customization**

   - Editable profile pictures
   - First name and last name editing
   - Profile color themes

3. **Modern UI/UX**
   - Clean, dark-themed interface
   - Responsive design for all devices
   - Smooth animations and transitions
   - Intuitive navigation

## Tech Stack

### Frontend

- **Framework**: React 19
- **Build Tool**: Vite
- **State Management**: Zustand
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS
- **Icons**: Lucide React & React Icons
- **Real-time Communication**: Socket.IO Client
- **Routing**: React Router DOM v7
- **HTTP Client**: Axios
- **Emoji Support**: emoji-picker-react
- **Notifications**: Sonner

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Real-time Communication**: Socket.IO
- **Authentication**: JWT & bcrypt
- **File Storage**: Cloudinary with Multer
- **Validation**: Validator.js
- **Security**: CORS, Cookie Parser
- **Environment**: dotenv

## Installation and Setup

### Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account or local MongoDB installation
- Cloudinary account for file storage

### Frontend Setup

1. Clone the repository

```bash
git clone <your-repository-url>
cd frontend/
```

2. Install dependencies

```bash
npm install
```

3. Create `.env` file in the frontend directory

```bash
VITE_SERVER_URL=http://localhost:3000
```

4. Start the development server

```bash
npm run dev
```

### Backend Setup

1. Navigate to backend directory

```bash
cd backend/
```

2. Install dependencies

```bash
npm install
```

3. Create `.env` file in the backend directory

```bash
PORT=3000
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:5173
ATLAS_DB_URL=your_mongodb_connection_string
CLOUD_NAME=your_cloudinary_cloud_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret
```

4. Start the server

```bash
npm run dev
```

## API Endpoints

### Authentication

- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/user-info` - Get current user
- `POST /api/auth/update-profile` - Update user profile
- `POST /api/auth/add-profile-image` - Update user profile image
- `POST /api/auth/delete-profile-image` - Remove user profile image

### Users

- `GET /api/user/get-users-for-dm` - Get all users except current user
- `GET /api/user/get-dm-contacts` - Get contacted users
- `GET /api/user/get-users-for-group` - Get all users except current user for creating group
- `POST /api/user/remove-notification` - Messages viewed
- `GET /api/user/get-user-info/:userId` - Get user info for DM from group

### Messages

- `GET /api/message/get-messages/:otherUserId` - Get chat messages
- `POST /api/message/upload-file` - Send image or file in a message
- `DELETE /api/message/delete` - Delete message

### Groups

- `POST /api/group/create-group` - Create group
- `GET /api/group/get-user-groups` - Get user groups
- `GET /api/group/get-group-messages` - Get group messages
- `PATCH /api/group/change-name` - Change group name (Group admin only)
- `PATCH /api/group/change-members` - Change group members (add/remove) (Group admin only)
- `PATCH /api/group/exit-group` - Exit group
- `DELETE /api/group/delete` - Delete group (Group admin only)

## Socket Events

### Client to Server

- `onlineContacts` - Updates online status indicator
- `isTypingInDM` - Sends typing indicator for direct messages
- `isTypingInGroup` - Sends typing indicator for group chats
- `sendMessage` - Sends new direct message
- `deleteMessage` - Deletes direct message instantly
- `groupCreated` - Notifies group members of new group creation
- `sendGroupMessage` - Sends new group message
- `changedGroupName` - Updates group name
- `changedGroupMembers` - Prevents removed members from sending messages instantly
- `deleteGroupMessage` - Deletes group message instantly
- `leftGroup` - Notifies when member leaves group
- `groupDeleted` - Prevents all members from sending messages when admin deletes group
- `disconnect` - Removes online status indicator

### Server to Client

- `connect` - Adds online status indicator
- `onlineContacts` - Broadcasts online status updates
- `receiveMessage` - Delivers direct message to recipient
- `receiveGroupMessage` - Delivers group message to all members
- `messageDeleted` - Notifies of instantly deleted message
- `groupCreated` - Notifies members of group creation
- `changedGroupName` - Broadcasts group name changes
- `changedGroupMembers` - Prevents removed members from sending messages instantly
- `removedFromGroup` - Notifies member of removal by admin (prevents further messaging)
- `leftGroup` - Notifies remaining members when someone leaves
- `groupDeleted` - Notifies all members when admin deletes group (prevents further messaging)

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Input validation and sanitization
- File upload restrictions
<!-- - Rate limiting (recommended for production) -->

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Future Enhancements

- [x] Typing indicator for group and dm
- [x] Unread messages for group and dm
- [x] Datestamp for messages
- [ ] Google OAuth for authentication
- [ ] Voice messages
- [ ] Message reactions
- [ ] Message forwarding
- [ ] Message mark as read
- [ ] Voice/video calling
- [ ] Group voice/video calls

## Author

**Asim Mulla** - Full Stack Developer

- GitHub: [@Asim-Mulla](https://github.com/Asim-Mulla)
- Email: asimmulla2004@gmail.com

## Acknowledgments

- React team for the amazing framework
- Socket.IO team for real-time communication
- shadcn/ui for beautiful UI components
- Tailwind CSS for utility-first styling
- Zustand for simple state management
- All open-source contributors

## Support

If you found this project helpful, please give it a ⭐ on GitHub!
