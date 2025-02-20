import { useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../supabaseClient"; // Ensure you have Supabase client setup

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const handleResetPassword = async () => {
    if (newPassword !== confirmNewPassword) {
      alert("New passwords do not match.");
      return;
    }

    const { data: users, error } = await supabase
      .from("USERS")
      .select("*")
      .eq("EMAIL", email);

    if (error || users.length === 0) {
      console.error("Error finding user or user not found:", error?.message);
      alert("User not found.");
    } else {
      const user = users[0];
      const { error: updateError } = await supabase
        .from("USERS")
        .update({ PASSWORD: newPassword })
        .eq("id", user.id);

      if (updateError) {
        console.error("Error updating password:", updateError.message);
        alert("Failed to reset password. Please try again.");
      } else {
        alert("Password reset successfully.");
        navigate("/");
      }
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-form">
        <h2>Reset Password</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="forgot-password-input"
        />
        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="forgot-password-input"
        />
        <input
          type="password"
          placeholder="Confirm New Password"
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
          className="forgot-password-input"
        />
        <button
          onClick={handleResetPassword}
          className="forgot-password-button"
        >
          Reset Password
        </button>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
