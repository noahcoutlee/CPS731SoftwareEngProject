import { useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../supabaseClient"; // Ensure you have Supabase client setup

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  const handleLogin = async () => {
    const { data: user, error } = await supabase
      .from("USERS")
      .select("*")
      .eq("EMAIL", email)
      .eq("PASSWORD", password) // Ensure password checking is secure in production
      .single();

    if (error) {
      console.error("Error logging in or user not found:", error?.message);
      alert("Login failed. Please check your credentials.");
    } else {
      localStorage.setItem("currentUserId", user.id); // Store user ID in local storage
      if (user.role == "admin") {
        navigate(`/admin`);
      } else {
        navigate(`/profile/${user.id}`);
      }
    }
  };

  const handleCreateAccount = async () => {
    const { data: existingUsers, error: checkError } = await supabase
      .from("USERS")
      .select("*")
      .eq("EMAIL", email);

    if (checkError) {
      console.error("Error checking existing users:", checkError.message);
      alert("Account creation failed. Please try again.");
      return;
    }

    if (existingUsers.length > 0) {
      alert("An account with this email already exists.");
      return;
    }

    const { error: createError } = await supabase
      .from("USERS")
      .insert([{ EMAIL: email, PASSWORD: password }])
      .single();

    if (createError) {
      console.error("Error creating account:", createError.message);
      alert("Account creation failed. Please try again.");
    } else {
      const { data: retrievedUserID } = await supabase
        .from("USERS")
        .select("*")
        .eq("EMAIL", email);

      localStorage.setItem("currentUserId", retrievedUserID[0].id); // Store user ID in local storage
      navigate(`/editprofile`);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>{isCreatingAccount ? "Create Account" : "Login"}</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="login-input"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="login-input"
        />
        <button
          className="login-button"
          onClick={isCreatingAccount ? handleCreateAccount : handleLogin}
        >
          {isCreatingAccount ? "Create Account" : "Login"}
        </button>
        <button
          className="toggle-button"
          onClick={() => setIsCreatingAccount(!isCreatingAccount)}
        >
          {isCreatingAccount
            ? "Already have an account? Login"
            : "Don't have an account? Create one"}
        </button>
        <button
          className="toggle-button"
          onClick={() => navigate("/forgotpassword")}
        >
          Forgot Password?
        </button>
      </div>
    </div>
  );
}

export default LoginPage;
