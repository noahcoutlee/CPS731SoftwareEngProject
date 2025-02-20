import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import supabase from "../supabaseClient";
import "./main.css";
import defaultProfile from "../Default.png";

function FollowingsPage() {
  const navigate = useNavigate();
  const [followings, setFollowings] = useState([]);
  const [loading, setLoading] = useState(true);
  // const userId = 1; // Replace with actual current user ID
  const userId = localStorage.getItem("currentUserId");

  useEffect(() => {
    if (!userId) {
      navigate("/"); // Redirect to login if no user ID is found
    }
  }, [navigate, userId]);

  useEffect(() => {
    const fetchFollowings = async () => {
      // Fetch the current user's following list
      const { data: userData, error: userError } = await supabase
        .from("USERS")
        .select("following")
        .eq("id", userId)
        .single();

      if (userError) {
        console.error("Error fetching user following list:", userError);
        setLoading(false);
        return;
      }

      const following = userData.following
        ? JSON.parse(userData.following)
        : [];

      // Fetch details for each followed user
      const fetchUserDetails = async (userId) => {
        const { data: userDetails, error } = await supabase
          .from("USERS")
          .select("*")
          .eq("id", userId)
          .single();

        if (error) {
          console.error(`Error fetching details for user ID ${userId}:`, error);
          return null;
        }

        // Fetch the profile picture URL
        let profilePictureUrl = null;
        const extensions = [".jpeg", ".jpg", ".png"];

        for (const ext of extensions) {
          try {
            const { data, error } = await supabase.storage
              .from("Profile Pictures")
              .download(`${userId}${ext}`);

            if (error) {
              throw error;
            }

            profilePictureUrl = URL.createObjectURL(data);
            break; // Exit the loop if a profile picture is found
          } catch (error) {
            console.error(
              `Error fetching profile picture with extension ${ext} for user ID ${userId}:`,
              error
            );
          }
        }

        return { ...userDetails, profile_picture_url: profilePictureUrl };
      };

      const followingsDetails = await Promise.all(
        following.map(fetchUserDetails)
      );
      setFollowings(followingsDetails);
      setLoading(false);
    };

    fetchFollowings();
  }, [userId]);

  return (
    <div>
      <Navbar />
      <div className="followings-container">
        <h2>People You Follow:</h2>
        {loading ? (
          <p>Loading followings...</p>
        ) : (
          followings.map((user) => (
            <div className="following" key={user.id}>
              <img
                src={user.profile_picture_url || defaultProfile}
                alt={`${user.FULL_NAME}'s profile`}
                className="profile-picture"
              />
              <div className="following-info">
                <h3
                  className="user-name"
                  onClick={() => navigate(`/profile/${user.id}`)}
                >
                  {user.FULL_NAME}
                </h3>
                <p className="user-email">{user.EMAIL}</p>
                <p className="user-summary">{user.SUMMARY}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default FollowingsPage;
