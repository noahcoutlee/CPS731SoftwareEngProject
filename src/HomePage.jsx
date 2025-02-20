import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import supabase from "../supabaseClient";
import "./main.css";
import defaultProfile from "../Default.png";

function HomePage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  // const userId = 1; // Replace with actual current user ID
  const userId = localStorage.getItem("currentUserId");

  useEffect(() => {
    if (!userId) {
      navigate("/"); // Redirect to login if no user ID is found
    }
  }, [navigate, userId]);

  useEffect(() => {
    const fetchPosts = async () => {
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

      // Fetch posts from people the user follows
      const { data: postData, error: postError } = await supabase
        .from("POSTS")
        .select("*")
        .in("CREATED_BY", following)
        .order("created_at", { ascending: false });

      if (postError) {
        console.error("Error fetching posts:", postError);
        setLoading(false);
        return;
      }

      // Fetch user details for each post
      const fetchUserDetails = async (createdBy) => {
        // Fetch the user data
        const { data: userData, error: userError } = await supabase
          .from("USERS")
          .select("*")
          .eq("id", createdBy)
          .single();

        if (userError) {
          console.error(
            `Error fetching user details for user ID ${createdBy}:`,
            userError
          );
          return null;
        }

        // Fetch the profile picture URL
        let profilePictureUrl = null;
        const extensions = [".jpeg", ".jpg", ".png"];

        for (const ext of extensions) {
          try {
            const { data, error } = await supabase.storage
              .from("Profile Pictures")
              .download(`${createdBy}${ext}`);

            if (error) {
              throw error;
            }

            profilePictureUrl = URL.createObjectURL(data);
            break; // Exit the loop if a profile picture is found
          } catch (error) {
            console.error(
              `Error fetching profile picture with extension ${ext} for user ID ${createdBy}:`,
              error
            );
          }
        }

        return { ...userData, profile_picture_url: profilePictureUrl };
      };

      // Combine post and user data
      const postsWithUserDetails = await Promise.all(
        postData.map(async (post) => {
          const userDetails = await fetchUserDetails(post.CREATED_BY);
          return { ...post, user: userDetails };
        })
      );

      setPosts(postsWithUserDetails);
      setLoading(false);
    };

    fetchPosts();
  }, [userId]);

  return (
    <div>
      <Navbar />
      <div className="feed-container">
        {loading ? (
          <p>Loading posts...</p>
        ) : (
          posts.map((post) => (
            <div className="post" key={post.id}>
              <div className="post-header">
                <img
                  src={post.user.profile_picture_url || defaultProfile}
                  alt={`${post.user.FULL_NAME}'s profile`}
                  className="profile-picture"
                />
                <div className="post-info">
                  <h3
                    className="user-name"
                    onClick={() => navigate(`/profile/${post.CREATED_BY}`)}
                  >
                    {post.user.FULL_NAME}
                  </h3>
                  <p className="post-title">{post.TITLE}</p>
                  <p className="post-body">{post.BODY}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default HomePage;
