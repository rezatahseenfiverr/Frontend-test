"use client";
import React, { useState, useEffect } from "react";
import ChatItem from "../components/ChatItem";
import { BiSearch, BiMessageRoundedDots } from "react-icons/bi";
import { useNavigate } from "react-router-dom";
import { useAdminChat } from "../context/AdminChatContext";

const ChatList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { 
    rooms, 
    loading, 
    error, 
    fetchRooms,
    unreadCount 
  } = useAdminChat();

  useEffect(() => {
    // Only fetch if rooms are empty and not loading
    if (rooms.length === 0 && !loading) {
      fetchRooms();
    }
  }, [rooms.length, loading]); // Include dependencies to prevent stale closure

  const filteredRooms = rooms.filter((room) => {
    const customerName = room.customerId?.firstName && room.customerId?.lastName
      ? `${room.customerId.firstName} ${room.customerId.lastName}`
      : room.customerId?.email || '';
    return customerName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Sort newest conversations first by last message time
  const sortedRooms = [...filteredRooms].sort((a, b) => {
    const aTime = new Date(a.messages?.[a.messages.length - 1]?.createdAt || 0).getTime();
    const bTime = new Date(b.messages?.[b.messages.length - 1]?.createdAt || 0).getTime();
    return bTime - aTime;
  });

  const handleRoomClick = (roomId) => navigate(`/admin/dashboard/inbox/${roomId}`);

  return (
    <div className="flex flex-col p-4 sm:ml-64 min-h-screen">
      <div className="flex-1 border-2 border-gray-200 border-dashed rounded-lg dark:border-gray-700 flex flex-col bg-white">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-2 sm:mb-0">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <BiMessageRoundedDots className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Customer Chats</h2>
                <p className="text-sm text-gray-500">
                  {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
                </p>
              </div>
            </div>
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Search customers..."
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <BiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-gray-500">Loading chats...</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-red-500 text-xl">!</span>
                </div>
                <p className="text-red-500">{error}</p>
              </div>
            </div>
          )}
          
          {!loading && !error && filteredRooms.length === 0 && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BiMessageRoundedDots className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg">No chats found</p>
                <p className="text-sm text-gray-400">
                  {searchTerm ? 'Try adjusting your search' : 'Start a conversation with customers'}
                </p>
              </div>
            </div>
          )}
          
          {!loading && !error && sortedRooms.length > 0 && (
            <div className="divide-y divide-gray-100">
                             {sortedRooms.map((room) => {
                 const unreadCount = (room.messages || []).filter(msg => (
                   msg.senderType === 'customer' && !((msg.readBy || []).some(read => read.readerType === 'admin'))
                 )).length;
                 
                 return (
                   <ChatItem
                     key={room._id}
                     customer={room.customerId}
                     lastMessage={room.messages?.[room.messages.length - 1]}
                     isActive={!!room.assignedAdmin?._id}
                     unreadCount={unreadCount}
                     onClick={() => handleRoomClick(room._id)}
                   />
                 );
               })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatList;
