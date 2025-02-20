import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import LoginPage from "./LoginPage";
import HomePage from "./HomePage";
import ProfilePage from "./ProfilePage";
import FollowingsPage from "./FollowingsPage";
import NotificationPage from "./NotificationPage";
import EditProfilePage from "./EditProfilePage";
import EditPasswordPage from "./EditPasswordPage";
import ForgotPasswordPage from "./ForgotPasswordPage";
import AdminPage from "./AdminPage";
import "./main.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/profile/:id" element={<ProfilePage />} />
        <Route path="/followings" element={<FollowingsPage />} />
        <Route path="/notifications" element={<NotificationPage />} />
        <Route path="/editprofile" element={<EditProfilePage />} />
        <Route path="/editpassword" element={<EditPasswordPage />} />
        <Route path="/forgotpassword" element={<ForgotPasswordPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
