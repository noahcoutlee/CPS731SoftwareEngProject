import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../supabaseClient"; // Ensure you have Supabase client setup

function EditPasswordPage() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const currentUserId = localStorage.getItem("currentUserId");

  useEffect(() => {
    if (!currentUserId) {
      navigate("/"); // Redirect to login if no user ID is found
    }
  }, [currentUserId, navigate]);

  const handleChangePassword = async () => {
    if (newPassword !== confirmNewPassword) {
      alert("New passwords do not match.");
      return;
    }

    const userId = localStorage.getItem("currentUserId");
    const { data: users, error } = await supabase
      .from("USERS")
      .select("*")
      .eq("id", userId)
      .eq("PASSWORD", currentPassword);

    if (error || users.length === 0) {
      console.error(
        "Error changing password or current password incorrect:",
        error?.message
      );
      alert("Current password is incorrect.");
    } else {
      const { error: updateError } = await supabase
        .from("USERS")
        .update({ PASSWORD: newPassword })
        .eq("id", userId);

      if (updateError) {
        console.error("Error updating password:", updateError.message);
        alert("Failed to change password. Please try again.");
      } else {
        alert("Password changed successfully.");
        navigate(`/profile/${currentUserId}`);
      }
    }
  };

  return (
    <div className="change-password-container">
      <div className="change-password-form">
        <h2>Change Password</h2>
        <input
          type="password"
          placeholder="Current Password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="change-password-input"
        />
        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="change-password-input"
        />
        <input
          type="password"
          placeholder="Confirm New Password"
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
          className="change-password-input"
        />
        <button
          onClick={handleChangePassword}
          className="change-password-button"
        >
          Change Password
        </button>
      </div>
    </div>
  );
}

export default EditPasswordPage;
