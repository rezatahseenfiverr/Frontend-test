# Chat System Setup Guide

## Environment Configuration

The chat system requires proper environment configuration to work correctly.

### Frontend Environment Variables

Create a `.env` file in the Frontend-Ecommerce directory:

```env
VITE_API_URI=http://localhost:5000
```

### Backend Environment Variables

Create a `.env` file in the BackEnd-Ecommerce directory:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret_here
MONGODB_URI=your_mongodb_connection_string
```

## Port Configuration

- **Backend**: Runs on port 5000 (default)
- **Frontend**: Runs on port 5173 (Vite default)
- **API Requests**: Should go to `http://localhost:5000`

## Authentication Issues

### Issue: "Invalid or expired token"

This error occurs when the admin authentication token is invalid or missing. Here's how to fix it:

1. **Check Available Tokens**: Use the `TokenDebug` component to see what tokens are stored
2. **Login as Admin**: Make sure you're properly logged in as an admin
3. **Token Storage**: The system looks for tokens in this order:
   - `adminAccessToken` (primary admin token)
   - `adminToken` (fallback)
   - `adminRefreshToken` (refresh token)
   - `accessToken` (user token fallback)

### Admin Login Process

1. Navigate to `/admin/login`
2. Login with valid admin credentials
3. The system should store the admin token in localStorage
4. Check browser console for authentication logs

### Token Debugging

Add the `TokenDebug` component to your admin page to troubleshoot:

```jsx
import TokenDebug from "../components/TokenDebug";

// Add this to your admin page
<TokenDebug />;
```

## Troubleshooting

### Issue: 401 Unauthorized Error

If you're getting 401 errors, check:

1. Backend is running on port 5000
2. Frontend environment variable is set correctly
3. User is properly authenticated
4. Token is valid and not expired
5. Admin is logged in with correct credentials

### Issue: Send Button Not Working

If the send button isn't working:

1. Check browser console for errors
2. Verify Socket.IO connection is established
3. Ensure chat room is created/fetched successfully
4. Check if user is logged in

### Issue: Unlimited Data Fetching

If the admin chat is fetching data continuously:

1. Check for infinite useEffect loops in ChatList component
2. Verify fetchRooms function is wrapped in useCallback
3. Ensure proper dependency arrays in useEffect hooks
4. Use AdminChatDebug component to monitor API calls

### Issue: Wrong Port (3000 instead of 5000)

If requests are going to port 3000:

1. Create a `.env` file in the Frontend-Ecommerce directory with:
   ```
   VITE_API_URI=http://localhost:5000
   ```
2. Restart the frontend development server
3. Clear browser cache
4. Check that the environment variable is loaded correctly

### Issue: Admin Authentication Failed

If admin authentication is failing:

1. Clear all tokens using the TokenDebug component
2. Login again as admin
3. Check that the admin token is properly stored
4. Verify the token format matches backend expectations

### Issue: Socket Not Connected

If Socket.IO is not connecting:

1. Check browser console for connection errors
2. Verify API_URI is correct (should be port 5000)
3. Ensure admin token is valid and not expired
4. Check backend Socket.IO server is running
5. Use AdminChatDebug component to monitor connection status

## Testing the Chat System

1. **Start Backend**: `npm run dev` in BackEnd-Ecommerce folder
2. **Start Frontend**: `npm run dev` in Frontend-Ecommerce folder
3. **User Chat**: Login as user and click chat icon
4. **Admin Chat**: Login as admin and navigate to chat list

## Debug Tools

### ChatDebug Component

Use the `ChatDebug` component to troubleshoot chat issues:

- Shows connection status
- Displays active room information
- Shows recent messages
- Provides test buttons

### TokenDebug Component

Use the `TokenDebug` component to troubleshoot authentication:

- Shows all stored tokens
- Allows clearing invalid tokens
- Helps identify token issues

### ApiTest Component

Use the `ApiTest` component to verify API configuration:

- Shows current API URI being used
- Indicates if environment variable is set
- Helps verify port configuration

### AdminChatDebug Component

Use the `AdminChatDebug` component to troubleshoot admin chat issues:

- Shows socket connection status
- Displays room and message counts
- Shows unread count and notification status
- Lists recent notifications
- Helps identify infinite fetching issues

## API Endpoints

### User Endpoints

- `GET /api/user/rooms/:customerId` - Get or create chat room
- `POST /api/user/rooms/:roomId/message` - Send message as user
- `POST /api/user/rooms/:roomId/read` - Mark messages as read
- `POST /api/user/rooms/:roomId/online` - Update online status

### Admin Endpoints

- `GET /api/rooms` - Get all chat rooms
- `GET /api/rooms/:roomId` - Get specific chat room
- `POST /api/rooms/:roomId/message` - Send message as admin
- `POST /api/rooms/:roomId/transfer` - Transfer room to another admin
- `POST /api/rooms/:roomId/close` - Close chat room
- `POST /api/rooms/:roomId/read` - Mark messages as read
- `POST /api/rooms/:roomId/online` - Update online status

## Common Token Issues

1. **Token Not Found**: Admin not logged in or token not stored
2. **Token Expired**: Token has expired, need to login again
3. **Wrong Token Type**: Using user token instead of admin token
4. **Token Format**: Token format doesn't match backend expectations
5. **Token Key Mismatch**: Using wrong localStorage key (fixed - now uses `adminAccessToken`)

## Token Key Alignment

The system now properly aligns token storage keys:

- **AdminContext**: Stores tokens as `adminAccessToken`, `adminRefreshToken`, `adminData`
- **AdminChatContext**: Looks for tokens in order: `adminAccessToken`, `adminToken`, `adminRefreshToken`, `accessToken`
- **TokenDebug**: Shows all possible token keys for debugging

## Quick Fix Steps

1. Clear all tokens using TokenDebug component
2. Login as admin again
3. Check browser console for authentication logs
4. Verify API requests are going to correct port (5000)
5. Test chat functionality

## Data Field Mapping

The system now properly handles user data fields:

- **Backend**: Populates `customerId` with `firstName`, `lastName`, `email`, `profileImage`
- **Frontend**: Displays customer names as `firstName + lastName` or falls back to `email`
- **Search**: Works with both full names and email addresses
- **Default Avatar**: Shows a placeholder when `profileImage` is not available

## UI Design Features

### Telegram-like Interface

The chat system now features a modern, Telegram-inspired design:

#### Chat List (ChatList.jsx)

- **Clean Header**: Icon, title, and unread count display
- **Smart Search**: Full-width search with icon
- **Loading States**: Animated spinner and proper loading indicators
- **Empty States**: Helpful messages when no chats are found
- **Responsive Layout**: Works on desktop and mobile

#### Chat Items (ChatItem.jsx)

- **Profile Pictures**: Circular avatars with online status indicators
- **Message Previews**: Truncated last message with smart time formatting
- **Read Receipts**: Check marks for sent/read messages
- **Unread Badges**: Blue notification badges for unread messages
- **Hover Effects**: Smooth transitions and visual feedback

#### Message Page (MessagePage.jsx)

- **Header Bar**: Back button, customer info, and action buttons
- **Message Bubbles**: Rounded message bubbles with different styles for sender/receiver
- **Profile Integration**: Customer avatar in header and next to messages
- **Smart Time Display**: "Today", "Yesterday", or date format
- **Input Area**: Rounded input with send button
- **Empty State**: Helpful message when no messages exist

### Design Features

- **Consistent Layout**: Matches the ChatList design structure
- **Modern Icons**: Uses React Icons for consistent iconography
- **Color Scheme**: Blue primary color with gray accents
- **Typography**: Clean, readable fonts with proper hierarchy
- **Spacing**: Consistent padding and margins throughout
- **Animations**: Smooth transitions and loading states

## Notification Features

### Admin Notifications

The admin chat system now includes real-time notifications:

- **Unread Count Badge**: Shows the number of unread messages in the sidebar inbox
- **Notification Popup**: Displays new message notifications in the top-right corner
- **Auto-hide**: Notifications automatically disappear after 5 seconds
- **Click to Navigate**: Click on notifications to go to the chat room
- **Smart Notifications**: Only shows notifications when not actively viewing the chat room

### Notification Components

- **NotificationPopup**: Reusable component for displaying notifications
- **Unread Count**: Dynamic badge showing total unread messages
- **Real-time Updates**: Notifications update automatically via Socket.IO

### Features

- **Message Notifications**: Shows sender name, message preview, and timestamp
- **Room Notifications**: Notifies when new chat rooms are created
- **Read Status**: Messages are marked as read when entering a chat room
- **Notification History**: Keeps track of recent notifications
- **Online Status**: Real-time online/offline indicators
- **Read Receipts**: Visual indicators for message delivery and read status
- **Unread Counts**: Badge notifications for unread messages
- **Responsive Design**: Works on desktop and mobile devices

## New Features Added

### User Chat Notifications

- **Unread Count Badge**: Shows number of unread messages on chat button
- **Notification Popup**: Displays new message notifications when chat is closed
- **Online Status**: Shows when admin is online in the chat header
- **Read Receipts**: Visual indicators for message delivery status

### Admin Chat Enhancements

- **Online Status Tracking**: Shows customer online status in chat header
- **Read Receipts**: Visual indicators for message delivery and read status
- **Unread Counts**: Badge notifications for unread messages in chat list
- **Real-time Updates**: All status changes update in real-time via Socket.IO

### Database Schema Updates

- **Message Read Status**: Added `readBy` array to track who has read each message
- **Online Users**: Added `onlineUsers` array to track who is currently online
- **Real-time Updates**: Socket.IO events for status changes

### Socket.IO Events

- **messagesRead**: Emitted when messages are marked as read
- **onlineStatusChanged**: Emitted when user online status changes
- **Real-time Notifications**: Instant updates for all chat participants
