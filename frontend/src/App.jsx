import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import Auth from "./pages/auth/Auth";
import Chat from "./pages/chat/Chat";
import Profile from "./pages/profile/Profile";
import { useAppStore } from "./store/store";
import { useEffect, useState } from "react";
import { getUserData } from "./services/authServices";
import Loading from "./pages/loading/Loading";

const PrivateRoute = ({ children }) => {
  const { userInfo } = useAppStore();
  const isAuthenticated = !!userInfo;
  return isAuthenticated ? children : <Navigate to="/auth" />;
};

const AuthRoute = ({ children }) => {
  const { userInfo } = useAppStore();
  const isAuthenticated = !!userInfo;
  return isAuthenticated ? <Navigate to="/chat" /> : children;
};

const App = () => {
  const { userInfo, setUserInfo } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async () => {
    try {
      const res = await getUserData();
      if (res.status === 200 && res.data.user) {
        setUserInfo(res.data.user);
      } else {
        setUserInfo(null);
      }
    } catch (error) {
      setUserInfo(null);
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!userInfo) {
      fetchUserData();
    } else {
      setIsLoading(false);
    }
  }, [userInfo, setUserInfo]);

  if (isLoading) {
    return <Loading />;
  }

  const router = createBrowserRouter([
    {
      path: "/auth",
      element: (
        <AuthRoute>
          <Auth />
        </AuthRoute>
      ),
    },
    {
      path: "/chat",
      element: (
        <PrivateRoute>
          <Chat />
        </PrivateRoute>
      ),
    },
    {
      path: "/profile",
      element: (
        <PrivateRoute>
          <Profile />
        </PrivateRoute>
      ),
    },
    {
      path: "/loading",
      element: <Loading />,
    },
    {
      path: "*",
      element: <Navigate to="/auth" />,
    },
  ]);

  return <RouterProvider router={router} />;
};

export default App;
