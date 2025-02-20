import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import supabase from "../supabaseClient";
import defaultProfile from "../Default.png";

import Navbar from "./Navbar";
import Post from "./Post";

function ProfileComponent({ key, title, children }) {
  return (
    <div className="section">
      <h3>{title}</h3>
      <ul dangerouslySetInnerHTML={{ __html: children }} key={key} />
    </div>
  );
}

const PostModal = ({
  show,
  onClose,
  onSave,
  title,
  setTitle,
  body,
  setBody,
}) => {
  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{title ? "Edit Post" : "Create Post"}</h2>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="Body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <button onClick={onSave}>Save</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

function ProfilePage() {
  const navigate = useNavigate();
  const { id: userID } = useParams(); // Get the user ID from URL parameters
  //const currentUserId = 1; // Replace with the actual current user ID
  const currentUserId = localStorage.getItem("currentUserId");
  const [fetchError, setFetchError] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // New loading state
  const [isFollowing, setIsFollowing] = useState(false); // Track follow status
  const [showModal, setShowModal] = useState(false); // State for showing modal
  const [editPost, setEditPost] = useState(null); // State for editing post
  const [newPostTitle, setNewPostTitle] = useState(""); // State for new post title
  const [newPostBody, setNewPostBody] = useState(""); // State for new post body
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    if (!currentUserId) {
      navigate("/"); // Redirect to login if no user ID is found
    }
  }, [currentUserId, navigate]);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true); // Set loading to true before fetching
      const { data, error } = await supabase
        .from("USERS")
        .select("*")
        .eq("id", userID)
        .not("role", "eq", "admin") // Exclude admins
        .single();

      if (error) {
        setFetchError("Could not fetch user data");
        setUser(null);
      } else {
        const profilePictureUrl = await fetchProfilePicture(userID);
        setUser({ ...data, profile_picture_url: profilePictureUrl });
        setFetchError(null);

        // Check if current user is following this profile user
        const { data: currentUser, error: currentUserError } = await supabase
          .from("USERS")
          .select("following, FULL_NAME")
          .eq("id", currentUserId)
          .single();

        if (!currentUserError && currentUser.following) {
          const followingList = JSON.parse(currentUser.following);
          setIsFollowing(followingList.includes(parseInt(userID)));
        }
      }
      setLoading(false); // Set loading to false after fetching
    };

    fetchUser();
  }, [userID, currentUserId]);

  const fetchProfilePicture = async (userId) => {
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

    return profilePictureUrl;
  };

  const handleFollowToggle = async () => {
    setLoading(true);

    // Fetch current user's following list
    const { data: currentUser, error: currentUserError } = await supabase
      .from("USERS")
      .select("following, FULL_NAME")
      .eq("id", currentUserId)
      .single();

    if (currentUserError) {
      console.error("Error fetching current user data:", currentUserError);
      setLoading(false);
      return;
    }

    let followingList = [];
    if (currentUser.following) {
      followingList = JSON.parse(currentUser.following);
    }

    let notificationMessage = "";
    if (isFollowing) {
      // Unfollow the user
      followingList = followingList.filter((id) => id !== parseInt(userID));
      notificationMessage = `${currentUser.FULL_NAME} has unfollowed you.`;
    } else {
      // Follow the user
      followingList.push(parseInt(userID));
      notificationMessage = `${currentUser.FULL_NAME} has started following you.`;
    }

    // Update the following list in the database
    const { error: updateError } = await supabase
      .from("USERS")
      .update({ following: JSON.stringify(followingList) })
      .eq("id", currentUserId);

    if (updateError) {
      console.error("Error updating following list:", updateError);
      setLoading(false);
      return;
    }

    // Create a notification
    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        user_id: userID,
        follower_id: currentUserId,
        message: notificationMessage,
        read: false,
      });

    if (notificationError) {
      console.error("Error creating notification:", notificationError);
    }

    // Update the local follow state
    setIsFollowing(!isFollowing);
    setLoading(false);
  };

  const [posts, setPosts] = useState(null);
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true); // Set loading to true before fetching
      const { data, error } = await supabase
        .from("POSTS")
        .select("")
        .eq("CREATED_BY", userID);

      if (error) {
        setFetchError("Could not fetch user data");
        setPosts(null);
      } else {
        setPosts(data);
        setFetchError(null);
      }
      setLoading(false); // Set loading to false after fetching
    };

    fetchPosts();
  }, [userID]);

  const handleCreatePost = () => {
    setEditPost(null); // Clear edit state
    setNewPostTitle("");
    setNewPostBody("");
    setShowModal(true);
  };

  const handleEditPost = (post) => {
    setEditPost(post);
    setNewPostTitle(post.TITLE);
    setNewPostBody(post.BODY);
    setShowModal(true);
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      setLoading(true);
      const { error } = await supabase.from("POSTS").delete().eq("id", postId);

      if (error) {
        console.error("Error deleting post:", error);
        setLoading(false);
        return;
      }

      // Refresh posts after deletion
      const { data, error: fetchError } = await supabase
        .from("POSTS")
        .select("*")
        .eq("CREATED_BY", userID);

      if (fetchError) {
        setFetchError("Could not fetch user data");
        setPosts(null);
      } else {
        setPosts(data);
        setFetchError(null);
      }
      setLoading(false);
    }
  };

  const handleSavePost = async () => {
    setLoading(true);
    if (editPost) {
      // Update existing post
      const { error } = await supabase
        .from("POSTS")
        .update({ TITLE: newPostTitle, BODY: newPostBody })
        .eq("id", editPost.id);

      if (error) {
        console.error("Error updating post:", error);
        setLoading(false);
        return;
      }
    } else {
      // Create new post
      const { error } = await supabase.from("POSTS").insert({
        TITLE: newPostTitle,
        BODY: newPostBody,
        CREATED_BY: currentUserId,
      });

      if (error) {
        console.error("Error creating post:", error);
        setLoading(false);
        return;
      }
    }

    setShowModal(false); // Close modal
    setLoading(false);
    // Refresh posts
    const { data, error } = await supabase
      .from("POSTS")
      .select("*")
      .eq("CREATED_BY", userID);

    if (error) {
      setFetchError("Could not fetch user data");
      setPosts(null);
    } else {
      setPosts(data);
      setFetchError(null);
    }
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000); // Hide the message after 3 seconds
  };

  const handleReportPost = async (postId) => {
    setLoading(true);

    const { error } = await supabase.from("reports").insert({
      post_id: postId,
      reporter_id: currentUserId,
    });

    if (error) {
      console.error("Error reporting post:", error);
      setLoading(false);
      return;
    }

    showSuccess("Report submitted successfully.");
    setLoading(false);
  };

  const handleEditProfile = () => {
    navigate(`/editprofile`);
  };

  if (loading || !user) {
    return (
      <Navbar>
        <div className="profile">
          <p>Loading user data...</p>
        </div>
      </Navbar>
    );
  }

  if (fetchError) {
    return (
      <Navbar>
        <div className="profile">
          <p className="error">{fetchError}</p>
        </div>
      </Navbar>
    );
  }

  return (
    <Navbar>
      <div className="profile">
        <div className="profile-header">
          <img
            src={user.profile_picture_url || defaultProfile}
            alt="User"
            className="profile-pic"
          />
          <div>
            <h2>
              {user.FULL_NAME} - {user.role}
              {currentUserId == userID && (
                <button className="follow-button" onClick={handleEditProfile}>
                  Edit
                </button>
              )}
            </h2>
            <p>{user.SUMMARY}</p>
            {currentUserId != userID && (
              <button
                className={`follow-button ${
                  isFollowing ? "unfollow" : "follow"
                }`}
                onClick={handleFollowToggle}
              >
                {isFollowing ? "- Unfollow" : "+ Follow"}
              </button>
            )}
          </div>
        </div>
        {user.EMAIL && (
          <ProfileComponent title="Contact Information">
            {user.EMAIL}
          </ProfileComponent>
        )}
        {user.EXPERIENCE && (
          <ProfileComponent title="Experience">
            {"<ul><li>" +
              user.EXPERIENCE.split("\n").join("</li><li>") +
              "</li></ul>"}
          </ProfileComponent>
        )}
        {user.CERTIFICATIONS && (
          <ProfileComponent title="Certifications">
            {"<ul><li>" +
              user.CERTIFICATIONS.split("\n").join("</li><li>") +
              "</li></ul>"}
          </ProfileComponent>
        )}
        {user.EDUCATION && (
          <ProfileComponent title="Education">
            {"<ul><li>" +
              user.EDUCATION.split("\n").join("</li><li>") +
              "</li></ul>"}
          </ProfileComponent>
        )}
        {user.RESEARCH && (
          <ProfileComponent title="Research">
            {"<ul><li>" +
              user.RESEARCH.split("\n").join("</li><li>") +
              "</li></ul>"}
          </ProfileComponent>
        )}
        {user.INTERESTS && (
          <ProfileComponent title="Areas of Interests">
            {"<ul><li>" +
              user.INTERESTS.split("\n").join("</li><li>") +
              "</li></ul>"}
          </ProfileComponent>
        )}

        <div className="section">
          <h3>Activity</h3>
          {currentUserId == userID && (
            <button className="create-post" onClick={handleCreatePost}>
              + Create Post
            </button>
          )}

          {posts &&
            posts.map((post) => (
              <Post
                key={post.id}
                title={post.TITLE}
                body={post.BODY}
                showEditDeleteButtons={currentUserId == userID}
                showReportButton={currentUserId != userID}
                onEdit={() => handleEditPost(post)}
                onDelete={() => handleDeletePost(post.id)}
                onReport={() => handleReportPost(post.id)}
              />
            ))}
        </div>
      </div>
      <PostModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSavePost}
        title={newPostTitle}
        setTitle={setNewPostTitle}
        body={newPostBody}
        setBody={setNewPostBody}
      />
      {showSuccessMessage && (
        <div className="success-message">{successMessage}</div>
      )}
    </Navbar>
  );
}

export default ProfilePage;
