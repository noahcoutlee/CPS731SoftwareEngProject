import { useState, useEffect, useRef } from "react";
import { FaHome, FaUser, FaBell, FaUserFriends } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import myImage from "../Logo 2.0.png";

function Navbar({ children }) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState(""); // Track input value
  const [searchResults, setSearchResults] = useState([]); // Store users fetched from Supabase
  const [isLoading, setIsLoading] = useState(false); // Loading indicator
  const searchResultsRef = useRef(null); // Ref for search results container
  const [hideSearchResults, setHideSearchResults] = useState(true);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false); // Track profile dropdown visibility
  const profileDropdownRef = useRef(null); // Ref for profile dropdown

  const userId = localStorage.getItem("currentUserId");

  useEffect(() => {
    if (!userId) {
      navigate("/"); // Redirect to login if no user ID is found
    }
  }, [navigate, userId]);

  // Fetch users from Supabase based on searchTerm
  useEffect(() => {
    const fetchUsers = async () => {
      if (searchTerm.trim() === "") {
        setSearchResults([]); // Clear results if search is empty
        return;
      }

      setIsLoading(true);
      const { data, error } = await supabase
        .from("USERS")
        .select("id, FULL_NAME") // Adjust columns as needed
        .or(`FULL_NAME.ilike.%${searchTerm}%`) // Search by first or last name (case-insensitive)
        .not("role", "eq", "admin") // Exclude admins
        .limit(5);

      if (error) {
        console.error("Error fetching users:", error);
        setSearchResults([]);
      } else {
        setSearchResults(data);
        setHideSearchResults(false);
      }
      setIsLoading(false);
    };

    // Debounce search for better performance
    const timeoutId = setTimeout(() => {
      fetchUsers();
    }, 300); // Delay by 300ms

    return () => clearTimeout(timeoutId); // Clear timeout on cleanup
  }, [searchTerm]);

  // Close search results if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchResultsRef.current &&
        !searchResultsRef.current.contains(event.target)
      ) {
        setHideSearchResults(true); // Hide search results when clicked outside
      }
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setShowProfileDropdown(false); // Hide profile dropdown when clicked outside
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside); // Cleanup on component unmount
    };
  }, []);

  const handleProfileClick = () => {
    setShowProfileDropdown((prev) => !prev); // Toggle profile dropdown visibility
  };

  const handleLogout = () => {
    // Add logout logic here
    navigate("/");
    localStorage.removeItem("currentUserId");
  };

  return (
    <div>
      <nav className="navbar" style={{ position: "relative" }}>
        <button
          className="icon-button"
          title="Home"
          onClick={() => navigate("/home")}
        >
          <img
            src={myImage}
            alt={<FaHome />}
            style={{ width: "40px", height: "40px" }}
          />
        </button>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search User"
            className="search-bar"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} // Update input value
          />
          {/* Display search results directly below the input */}
          {searchTerm && !hideSearchResults && (
            <div className="search-results" ref={searchResultsRef}>
              {isLoading && <p>Loading...</p>} {/* Loading indicator */}
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="search-result-item"
                  onClick={() => navigate(`/profile/${user.id}`)} // Navigate to user profile on click
                >
                  {user.FULL_NAME}
                </div>
              ))}
              {!isLoading && searchResults.length === 0 && (
                <p>No users found.</p>
              )}
            </div>
          )}
        </div>
        <button
          className="icon-button"
          title="Following List"
          onClick={() => navigate("/followings")}
        >
          <FaUserFriends />
        </button>
        <button
          className="icon-button"
          title="Notifications"
          onClick={() => navigate("/notifications")}
        >
          <FaBell />
        </button>
        <div style={{ position: "relative" }}>
          <button
            className="icon-button"
            title="Profile"
            onClick={handleProfileClick}
          >
            <FaUser />
          </button>
          {showProfileDropdown && (
            <div className="profile-dropdown" ref={profileDropdownRef}>
              <div
                className="profile-dropdown-item"
                onClick={() => navigate(`/profile/${userId}`)}
              >
                Profile
              </div>
              <div
                className="profile-dropdown-item"
                onClick={() => navigate("/editpassword")}
              >
                Change Password
              </div>
              <div className="profile-dropdown-item" onClick={handleLogout}>
                Logout
              </div>
            </div>
          )}
        </div>
      </nav>

      {children}
    </div>
  );
}

export default Navbar;
