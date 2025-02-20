import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import supabase from "../supabaseClient";
import "./main.css";
import defaultProfile from "../Default.png";

function NotificationPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  // const userId = 1; // Replace with the actual current user ID
  const userId = localStorage.getItem("currentUserId");

  useEffect(() => {
    if (!userId) {
      navigate("/"); // Redirect to login if no user ID is found
    }
  }, [navigate, userId]);

  useEffect(() => {
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .eq("read", false) // Only fetch unread notifications
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching notifications:", error);
        setLoading(false);
        return;
      }

      // Fetch profile pictures for each notification
      const fetchProfilePicture = async (followerId) => {
        let profilePictureUrl = null;
        const extensions = [".jpeg", ".jpg", ".png"];

        for (const ext of extensions) {
          try {
            const { data, error } = await supabase.storage
              .from("Profile Pictures")
              .download(`${followerId}${ext}`);

            if (error) {
              throw error;
            }

            profilePictureUrl = URL.createObjectURL(data);
            break; // Exit the loop if a profile picture is found
          } catch (error) {
            console.error(
              `Error fetching profile picture with extension ${ext} for user ID ${followerId}:`,
              error
            );
          }
        }

        return profilePictureUrl;
      };

      // Combine notification data with profile pictures
      const notificationsWithPictures = await Promise.all(
        data.map(async (notification) => {
          const profilePictureUrl = await fetchProfilePicture(
            notification.follower_id
          );
          return { ...notification, profile_picture_url: profilePictureUrl };
        })
      );

      setNotifications(notificationsWithPictures);
      setLoading(false);
    };

    fetchNotifications();
  }, [userId]);

  const markAsRead = async (notificationId) => {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);

    if (error) {
      console.error("Error updating notification:", error);
      return;
    }

    // Remove the notification from the state
    setNotifications(
      notifications.filter((notification) => notification.id !== notificationId)
    );
  };

  return (
    <div>
      <Navbar />
      <div className="notifications-container">
        <h2>Notifications:</h2>
        {loading ? (
          <p>Loading notifications...</p>
        ) : (
          notifications.map((notification) => (
            <div className="notification" key={notification.id}>
              <img
                src={notification.profile_picture_url || defaultProfile}
                alt="Profile"
                className="notification-profile-picture"
              />
              <div className="notification-info">
                <p>{notification.message}</p>
              </div>
              <button
                className="mark-as-read"
                onClick={() => markAsRead(notification.id)}
              >
                ✓
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default NotificationPage;
