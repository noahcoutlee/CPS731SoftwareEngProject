import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import "./main.css";
import defaultProfile from "../Default.png";

function AdminPage() {
  const navigate = useNavigate();
  const [reportedPosts, setReportedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      const userId = localStorage.getItem("currentUserId");
      if (!userId) {
        navigate("/"); // Redirect to login page if no userId exists
        return;
      }

      // Check if the user is an admin
      const { data: userData, error: userError } = await supabase
        .from("USERS")
        .select("*")
        .eq("id", userId)
        .single();

      if (userError) {
        console.error("Error fetching user data:", userError);
        return;
      }

      // If the user is not an admin, redirect them to a different page (e.g., HomePage)
      if (userData.role !== "admin") {
        navigate("/"); // Redirect non-admin users to the home page
      } else {
        setIsAdmin(true); // If user is admin, allow access to AdminPage
        fetchReportedPosts(); // Proceed to fetch reported posts
      }
    };

    checkAdminStatus();
  }, [navigate]);

  const fetchReportedPosts = async () => {
    const { data: reports, error: reportsError } = await supabase
      .from("reports")
      .select("*");

    if (reportsError) {
      setFetchError("Could not fetch reported posts.");
      setReportedPosts([]);
    } else {
      // Get corresponding posts for each report
      const postsPromises = reports.map(async (report) => {
        const { data: post, error: postError } = await supabase
          .from("POSTS")
          .select("*")
          .eq("id", report.post_id)
          .single();

        if (postError) {
          console.error("Error fetching post:", postError);
          return null; // return null in case of error to avoid processing
        }

        // Fetch the user data (profile picture, full name)
        const { data: user, error: userError } = await supabase
          .from("USERS")
          .select("*")
          .eq("id", post.CREATED_BY)
          .single();

        if (userError) {
          console.error("Error fetching user:", userError);
          return null; // return null in case of error to avoid processing
        }

        // Fetch the profile picture URL
        let profilePictureUrl = null;
        const extensions = [".jpeg", ".jpg", ".png"];

        for (const ext of extensions) {
          try {
            const { data, error } = await supabase.storage
              .from("Profile Pictures")
              .download(`${post.CREATED_BY}${ext}`);

            if (error) {
              throw error;
            }

            profilePictureUrl = URL.createObjectURL(data);
            break; // Exit the loop if a profile picture is found
          } catch (error) {
            console.error(
              `Error fetching profile picture with extension ${ext} for user ID ${post.CREATED_BY}:`,
              error
            );
          }
        }

        return { report, post, user, profile_picture_url: profilePictureUrl }; // return all relevant data
      });

      // Wait for all promises to resolve
      const postsWithReports = await Promise.all(postsPromises);
      // Filter out any null results caused by errors
      setReportedPosts(postsWithReports.filter((item) => item !== null));
      setFetchError(null);
    }
    setLoading(false);
  };

  const handleMarkAsSafe = async (reportId) => {
    setLoading(true);
    const { error } = await supabase
      .from("reports")
      .delete()
      .eq("id", reportId);

    if (error) {
      console.error("Error marking post as safe:", error);
    } else {
      setReportedPosts(
        reportedPosts.filter((post) => post.report.id !== reportId)
      );
    }
    setLoading(false);
  };

  const handleDeletePost = async (postId, reportId, userId) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      setLoading(true);

      // Delete the report from REPORTS table
      const { error: reportDeleteError } = await supabase
        .from("reports")
        .delete()
        .eq("id", reportId);

      if (reportDeleteError) {
        console.error("Error deleting report:", reportDeleteError);
        setLoading(false);
        return;
      }

      // Delete the post from POSTS table
      const { error: postDeleteError } = await supabase
        .from("POSTS")
        .delete()
        .eq("id", postId);

      if (postDeleteError) {
        console.error("Error deleting post:", postDeleteError);
        setLoading(false);
        return;
      }

      // Create a notification for the user
      const { error: notificationError } = await supabase
        .from("notifications")
        .insert({
          user_id: userId,
          message:
            "Your post has been removed due to violation of platform policies.",
          read: false,
        });

      if (notificationError) {
        console.error("Error creating notification:", notificationError);
      }

      setReportedPosts(
        reportedPosts.filter((post) => post.report.id !== reportId)
      );
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return <p>Access Denied: You do not have permission to view this page.</p>;
  }

  if (loading) {
    return <p>Loading reported posts...</p>;
  }

  if (fetchError) {
    return <p className="error">{fetchError}</p>;
  }

  return (
    <div className="admin-page">
      <h2>Reported Posts</h2>
      {reportedPosts.length === 0 ? (
        <p>No reported posts at the moment.</p>
      ) : (
        <ul>
          {reportedPosts.map(({ report, post, user, profile_picture_url }) => (
            <div className="post" key={report.id}>
              <div className="post-header">
                <img
                  src={profile_picture_url || defaultProfile}
                  alt={`${user.FULL_NAME}'s profile`}
                  className="profile-picture"
                />
                <div className="post-info">
                  <h3
                    className="user-name"
                    onClick={() => navigate(`/profile/${post.CREATED_BY}`)}
                  >
                    {user.FULL_NAME}
                  </h3>
                  <h3>{post.TITLE}</h3>
                  <p>{post.BODY}</p>
                  <p>{post.CREATED_BY}</p>
                  <button
                    className="safe-button"
                    onClick={() => handleMarkAsSafe(report.id)}
                  >
                    Mark as Safe
                  </button>
                  <button
                    className="report-button"
                    onClick={() =>
                      handleDeletePost(post.id, report.id, post.CREATED_BY)
                    }
                  >
                    Delete Post
                  </button>
                </div>
              </div>
            </div>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AdminPage;
