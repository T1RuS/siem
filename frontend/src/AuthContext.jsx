import React, { useState } from "react";

const AuthContext = React.createContext({
  isLoggedIn: false
});

export const AuthProvider = ({ children }) => {
  // This example user context could be in your redux store.
  const users = {
    "client-1": {
      id: "client-1",
      username: "Client One",
      permissions: ["view-users"]
    },
    "admin-1": {
      id: "admin-1",
      username: "Admin One",
      permissions: ["view-users", "edit-user", "manage-settings"]
    }
  };

  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("current-user") ? !!localStorage.getItem("current-user") : null
  );
  const [currentUserId, setCurrentUserId] = useState(
    localStorage.getItem("current-user")
  );
  const fakeWait = 1000;

  const login = async ({ userId, history, from }) => {
    await setTimeout(() => {
      localStorage.setItem("current-user", userId);
      setCurrentUserId(userId);
      setIsLoggedIn(true);

      if (from.pathname === "/" || from.pathname === "/login") {
        history.push("/dashboard");
      } else {
        history.replace(from);
      }
    }, fakeWait);

    return isLoggedIn;
  };

  const logout = async () => {
    localStorage.removeItem("current-user");
    localStorage.removeItem("access_token");

    await setTimeout(() => {
      setIsLoggedIn(false);
    }, fakeWait);

    return isLoggedIn;
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        login,
        logout,
        currentUser: users[currentUserId]
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
