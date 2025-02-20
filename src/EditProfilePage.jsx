import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";

function EditProfilePage() {
  const navigate = useNavigate();
  // const currentUserId = 1; // Replace with the actual current user ID
  const currentUserId = localStorage.getItem("currentUserId");
  const [user, setUser] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [summary, setSummary] = useState("");
  const [experience, setExperience] = useState("");
  const [certifications, setCertifications] = useState("");
  const [education, setEducation] = useState("");
  const [research, setResearch] = useState("");
  const [interests, setInterests] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);

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
        .eq("id", currentUserId)
        .single();

      if (error) {
        setFetchError("Could not fetch user data");
        setUser(null);
      } else {
        setUser(data);
        setRole(data.role);
        setFullName(data.FULL_NAME);
        setEmail(data.EMAIL);
        setSummary(data.SUMMARY);
        setExperience(data.EXPERIENCE);
        setCertifications(data.CERTIFICATIONS);
        setEducation(data.EDUCATION);
        setResearch(data.RESEARCH);
        setInterests(data.INTERESTS);
        const profilePictureUrl = await fetchProfilePicture(currentUserId);
        setProfilePicture(profilePictureUrl);
        setFetchError(null);
      }
      setLoading(false); // Set loading to false after fetching
    };

    fetchUser();
  }, [currentUserId]);

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

  const handleSave = async () => {
    setLoading(true);

    // Update user profile information
    const { error } = await supabase
      .from("USERS")
      .update({
        FULL_NAME: fullName,
        EMAIL: email,
        SUMMARY: summary,
        EXPERIENCE: experience,
        CERTIFICATIONS: certifications,
        EDUCATION: education,
        RESEARCH: research,
        INTERESTS: interests,
        role: role,
      })
      .eq("id", currentUserId);

    if (error) {
      console.error("Error updating profile:", error);
      setLoading(false);
      return;
    }

    // Check if a new profile picture was selected
    if (profilePicturePreview) {
      // Remove any existing profile picture files
      const extensions = [".jpeg", ".jpg", ".png"];
      for (const ext of extensions) {
        try {
          const { error: deleteError } = await supabase.storage
            .from("Profile Pictures")
            .remove([`${currentUserId}${ext}`]);

          if (deleteError) {
            console.error(
              `Error deleting profile picture with extension ${ext}:`,
              deleteError
            );
          }
        } catch (error) {
          console.error(
            `Error deleting profile picture with extension ${ext}:`,
            error
          );
        }
      }

      // Upload the new profile picture
      const { error: uploadError } = await supabase.storage
        .from("Profile Pictures")
        .upload(
          `${currentUserId}.${profilePicture.name.split(".").pop()}`,
          profilePicture,
          {
            cacheControl: "0",
            upsert: true,
          }
        );

      if (uploadError) {
        console.error("Error uploading profile picture:", uploadError);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    navigate(`/profile/${currentUserId}`);
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      const previewUrl = URL.createObjectURL(file);
      setProfilePicturePreview(previewUrl);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (fetchError) {
    return <p className="error">{fetchError}</p>;
  }

  return (
    <div className="edit-profile-container">
      <button
        className="back-button"
        onClick={() => navigate(`/profile/${currentUserId}`)}
      >
        Back
      </button>
      <h2>Edit Profile</h2>
      <div>
        <label>
          Full Name:
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </label>
      </div>
      <div>
        <label>
          Role:
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="Student">Student</option>
            <option value="Professor">Professor</option>
          </select>
        </label>
      </div>
      <div>
        <label>
          Email:
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
      </div>
      <div>
        <label>
          Summary:
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
        </label>
      </div>
      <div>
        <label>
          Experience:
          <textarea
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
          />
        </label>
      </div>
      <div>
        <label>
          Certifications:
          <textarea
            value={certifications}
            onChange={(e) => setCertifications(e.target.value)}
          />
        </label>
      </div>
      <div>
        <label>
          Education:
          <textarea
            value={education}
            onChange={(e) => setEducation(e.target.value)}
          />
        </label>
      </div>
      <div>
        <label>
          Research:
          <textarea
            value={research}
            onChange={(e) => setResearch(e.target.value)}
          />
        </label>
      </div>
      <div>
        <label>
          Interests:
          <textarea
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
          />
        </label>
      </div>
      <div>
        <label>
          Profile Picture:
          <input
            type="file"
            accept="image/*"
            onChange={handleProfilePictureChange}
          />
        </label>
      </div>
      {profilePicturePreview && (
        <img
          src={profilePicturePreview}
          alt="Profile"
          className="profile-pic-preview"
        />
      )}
      <button onClick={handleSave}>Save</button>
    </div>
  );
}

export default EditProfilePage;
