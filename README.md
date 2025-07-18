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
![Google OAuth](https://img.shields.io/badge/Google-OAuth2-4285F4?style=for-the-badge&logo=google)

**ChatRift** is a comprehensive real-time chat application that enables users to communicate through direct messages and group chats. Built with modern web technologies, it offers a seamless messaging experience with file sharing, emoji support, typing indicators, and robust user management features.

## Project Overview

ChatRift provides a complete messaging platform with user authentication, contact management, real-time messaging, file sharing capabilities, and group chat functionality. The application features a clean, modern interface built with shadcn/ui components and Tailwind CSS, ensuring a responsive and intuitive user experience.

## UI Previews

| Login / Signup Page                                                                                                                                                                                        | Profile Management                                                                                                                                                                                | New Contact Selection                                                                                                                                                                              |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [![Login/Signup Page](https://res.cloudinary.com/dpgu4conz/image/upload/v1752397863/01-login-signup_fsufge.png)](https://res.cloudinary.com/dpgu4conz/image/upload/v1752397863/01-login-signup_fsufge.png) | [![Profile Management](https://res.cloudinary.com/dpgu4conz/image/upload/v1752397863/02-profile_f5ftph.png)](https://res.cloudinary.com/dpgu4conz/image/upload/v1752397863/02-profile_f5ftph.png) | [![New Contact Selection](https://res.cloudinary.com/dpgu4conz/image/upload/v1752397863/03-new-dm_bpimlp.png)](https://res.cloudinary.com/dpgu4conz/image/upload/v1752397863/03-new-dm_bpimlp.png) |

| Chat with Emoji Support                                                                                                                                                                                      | File Sharing                                                                                                                                                                                      | Message Deletion                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [![Chat with Emoji Support](https://res.cloudinary.com/dpgu4conz/image/upload/v1752397864/04-chat-emoji_lgzuyw.png)](https://res.cloudinary.com/dpgu4conz/image/upload/v1752397864/04-chat-emoji_lgzuyw.png) | [![File Sharing](https://res.cloudinary.com/dpgu4conz/image/upload/v1752397864/05-chat-files_j4tidn.png)](https://res.cloudinary.com/dpgu4conz/image/upload/v1752397864/05-chat-files_j4tidn.png) | [![Message Deletion](https://res.cloudinary.com/dpgu4conz/image/upload/v1752397864/06-message-delete_gbre1y.png)](https://res.cloudinary.com/dpgu4conz/image/upload/v1752397864/06-message-delete_gbre1y.png) |

| New Group                                                                                                                                                                                         | Group Chat                                                                                                                                                                                      | Group Edit                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [![Group Creation](https://res.cloudinary.com/dpgu4conz/image/upload/v1752397864/07-new-group_ehgnnb.png)](https://res.cloudinary.com/dpgu4conz/image/upload/v1752397864/07-new-group_ehgnnb.png) | [![Group Chat](https://res.cloudinary.com/dpgu4conz/image/upload/v1752397864/08-group-chat_u9826a.png)](https://res.cloudinary.com/dpgu4conz/image/upload/v1752397864/08-group-chat_u9826a.png) | [![Group Editing](https://res.cloudinary.com/dpgu4conz/image/upload/v1752397864/09-edit-group_djq7lb.png)](https://res.cloudinary.com/dpgu4conz/image/upload/v1752397864/09-edit-group_djq7lb.png) |

## Features

### Core Messaging Features

1. **Real-Time Communication**

   - Instant messaging with Socket.IO
   - Live typing indicators for both DMs and groups
   - Real-time message delivery
   - Online/offline status indicators

2. **Rich Message Support**

   - Text messages with emoji support
   - Comprehensive emoji picker with categories
   - File sharing (images, PDFs, documents, ZIP files, audio, video, and more)
   - File download functionality
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
   - Google OAuth 2.0 authentication
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
- **Authentication**: JWT and bcrypt
- **File Storage**: Cloudinary with Multer
- **Validation**: Validator.js
- **Security**: CORS, Cookie Parser
- **Environment**: dotenv

## Installation and Setup

### Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account or local MongoDB installation
- Cloudinary account for file storage
- Google cloud console

### Frontend Setup

1. Clone the repository

```bash
git clone https://github.com/Asim-Mulla/ChatRift.git
cd frontend/
```

2. Install dependencies

```bash
npm install
```

3. Create `.env` file in the frontend directory

```bash
VITE_SERVER_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=your_google_client_id # you can get from cloud console
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
NODE_ENV=development # use'production' while deploying
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:5173

# Database
ATLAS_DB_URL=your_mongodb_connection_string

# Cloud media storage
CLOUD_NAME=your_cloudinary_cloud_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret

# Google OAuth authentication
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Otp verification for regular authentication
EMAIL=your_email
EMAIL_PASSWORD=your_emails_app_password
```

4. Start the server

```bash
npm run dev
```

## API Endpoints

### Authentication

- `POST /api/auth/get-otp` - Get otp on entered email for verification
- `POST /api/auth/verify-otp-signup` - User Registration if correct otp
- `POST /auth/google?code=${code}` - Login/Signup using google
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
- `PATCH /api/message/edit` - Edit message

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
- `messageEdited` - Message edited instantly
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
- `messageEdited` - Message edited instantly
- `groupCreated` - Notifies members of group creation
- `changedGroupName` - Broadcasts group name changes
- `changedGroupMembers` - Prevents removed members from sending messages instantly
- `removedFromGroup` - Notifies member of removal by admin (prevents further messaging)
- `leftGroup` - Notifies remaining members when someone leaves
- `groupDeleted` - Notifies all members when admin deletes group (prevents further messaging)

## Security Features

- JWT-based authentication
- Google OAuth 2.0 authentication
- Otp rate limiting
- Password hashing with bcrypt
- CORS protection
- Input validation
- File upload restrictions

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
- [x] OTP verification for regular authentication
- [x] Google OAuth for authentication
- [x] Read receipts (message seen status)
- [x] Message editing
- [ ] Voice messages
- [ ] Message reactions
- [ ] Message forwarding
- [ ] Group/Individual voice/video calls

## Author

**Asim Mulla** - Full Stack Developer

- GitHub: [@Asim-Mulla](https://github.com/Asim-Mulla)
- Email: asimmulla2004@gmail.com

## Acknowledgments

- React team for the amazing framework
- Socket.IO team for real-time communication
- Google OAuth for seamless authentication and authorization
- shadcn/ui for beautiful UI components
- Tailwind CSS for utility-first styling
- Zustand for simple state management
- All open-source contributors

## Support

If you found this project helpful, please give it a ⭐ on GitHub!
