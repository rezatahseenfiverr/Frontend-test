import React, { useState } from "react";

const TokenDebug = () => {
  const [showTokens, setShowTokens] = useState(false);

  const getTokens = () => {
    const tokens = {
      adminAccessToken: localStorage.getItem("adminAccessToken"),
      adminToken: localStorage.getItem("adminToken"),
      adminRefreshToken: localStorage.getItem("adminRefreshToken"),
      accessToken: localStorage.getItem("accessToken"),
      refreshToken: localStorage.getItem("refreshToken"),
    };

    return tokens;
  };

  const clearAllTokens = () => {
    localStorage.removeItem("adminAccessToken");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminRefreshToken");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setShowTokens(false);
  };

  const tokens = getTokens();

  return (
    <div className="p-4 bg-red-100 rounded-lg border-2 border-red-400">
      <h3 className="text-lg font-bold mb-2">Token Debug Panel</h3>
      <button
        onClick={() => setShowTokens(!showTokens)}
        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 mb-2"
      >
        {showTokens ? "Hide" : "Show"} Tokens
      </button>
      
                   {showTokens && (
               <div className="space-y-2 text-xs">
                 <div>
                   <strong>adminAccessToken:</strong> {tokens.adminAccessToken ? `${tokens.adminAccessToken.substring(0, 20)}...` : "Not found"}
                 </div>
                 <div>
                   <strong>adminToken:</strong> {tokens.adminToken ? `${tokens.adminToken.substring(0, 20)}...` : "Not found"}
                 </div>
                 <div>
                   <strong>adminRefreshToken:</strong> {tokens.adminRefreshToken ? `${tokens.adminRefreshToken.substring(0, 20)}...` : "Not found"}
                 </div>
                 <div>
                   <strong>accessToken:</strong> {tokens.accessToken ? `${tokens.accessToken.substring(0, 20)}...` : "Not found"}
                 </div>
                 <div>
                   <strong>refreshToken:</strong> {tokens.refreshToken ? `${tokens.refreshToken.substring(0, 20)}...` : "Not found"}
                 </div>
               </div>
             )}
      
      <div className="mt-4">
        <button
          onClick={clearAllTokens}
          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Clear All Tokens
        </button>
      </div>
    </div>
  );
};

export default TokenDebug;
