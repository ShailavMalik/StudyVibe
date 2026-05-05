import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { blogPosts, getAllCategories } from "../data/blogData";
import { AuthContext } from "../contexts/authContext";
import { api } from "../services/api";
import Footer from "../components/Reusable/Footer";
import Sidebar from "../components/Reusable/Sidebar";
import { FaHeart } from "react-icons/fa";

/**
 * Blog Page Component
 * Displays all blog posts with filtering and persistent likes
 * Integrates with backend API for like/unlike functionality
 *
 * Features:
 * - Category filtering
 * - Persistent likes via MongoDB
 * - Sidebar navigation
 * - Responsive grid layout
 */
const Blog = () => {
  const { user } = useContext(AuthContext);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [posts, setPosts] = useState(blogPosts);
  const [likedPosts, setLikedPosts] = useState({});
  const [loading, setLoading] = useState({});
  const categories = ["All", ...getAllCategories()];

  // Fetch blog posts from API on mount
  useEffect(() => {
    fetchBlogsFromAPI();
  }, []);

  /**
   * Fetch all blogs from API to get current like status
   */
  const fetchBlogsFromAPI = async () => {
    try {
      const response = await api.get("/api/blogs");
      let blogList = response.data;

      if ((!blogList || blogList.length === 0) && import.meta.env.DEV) {
        try {
          await api.post("/api/blogs/init/seed", { blogs: blogPosts });
          const seededResponse = await api.get("/api/blogs");
          blogList = seededResponse.data;
        } catch (seedError) {
          console.warn("Failed to seed blogs in dev:", seedError);
        }
      }

      // Create a likes map from API response
      const likesMap = {};
      blogList.forEach((blog) => {
        likesMap[blog.id] = {
          liked:
            user && blog.likedBy ?
              blog.likedBy.some((likeUserId) => {
                return likeUserId === user.id || likeUserId?._id === user.id;
              })
            : false,
          count: blog.likes || 0,
        };
      });
      setLikedPosts(likesMap);

      // Use API blogs if available, fallback to static data
      if (blogList && blogList.length > 0) {
        setPosts(blogList);
      }
    } catch (error) {
      console.warn("Error fetching blogs from API, using static data:", error);
      // Fallback to static data - initialize likes map from static data
      const likesMap = {};
      blogPosts.forEach((post) => {
        likesMap[post.id] = {
          liked: false,
          count: post.likes || 0,
        };
      });
      setLikedPosts(likesMap);
    }
  };

  // Filter posts based on selected category
  const filteredPosts =
    selectedCategory === "All" ? posts : (
      posts.filter((post) => post.category === selectedCategory)
    );

  /**
   * Toggle like status for a blog post
   * Makes API call to persist like in database
   */
  const handleLike = async (postId) => {
    if (!user) {
      // Show login prompt or redirect
      window.location.href = "/login";
      return;
    }

    try {
      setLoading((prev) => ({ ...prev, [postId]: true }));

      // Use MongoDB _id if available, otherwise use the numeric id
      const blogId = posts.find((p) => p.id === postId)?._id || postId;

      const response = await api.post(`/api/blogs/${blogId}/like`);

      // Update local state with new like data
      setLikedPosts((prev) => ({
        ...prev,
        [postId]: {
          liked: response.data.liked,
          count: response.data.likes,
        },
      }));
    } catch (error) {
      console.error("Error toggling like:", error);
      alert("Failed to update like. Please try again.");
    } finally {
      setLoading((prev) => ({ ...prev, [postId]: false }));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="flex flex-1">
        <Sidebar />
        <div className="flex-1">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16 w-full">
            <div className="container mx-auto px-4">
              <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
                📚 Exam Success Blog
              </h1>
              <p className="text-xl text-center text-blue-100 max-w-2xl mx-auto">
                Proven study strategies, exam tips, and best practices to help
                you succeed
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 container mx-auto px-4 py-12 w-full">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-3 justify-center mb-12">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-6 py-2 rounded-full font-medium transition-all ${
                    selectedCategory === category ?
                      "bg-blue-600 text-white shadow-lg scale-105"
                    : "bg-white text-gray-700 hover:bg-blue-50 shadow"
                  }`}>
                  {category}
                </button>
              ))}
            </div>

            {/* Blog Posts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="group bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden">
                  {/* Post Image */}
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        // Fallback if image doesn't load
                        e.target.style.display = "none";
                      }}
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-white text-blue-600 px-3 py-1 rounded-full text-sm font-semibold shadow">
                        {post.category}
                      </span>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {post.title}
                    </h2>

                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>

                    {/* Meta Info */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{post.author}</span>
                      </div>
                      <span>{post.readTime}</span>
                    </div>

                    <div className="mt-2 text-xs text-gray-400">
                      {post.date}
                    </div>

                    {/* Like + Read Actions */}
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => handleLike(post.id)}
                        disabled={loading[post.id]}
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold transition-colors ${
                          likedPosts[post.id]?.liked ?
                            "bg-red-100 text-red-600"
                          : "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600"
                        } ${loading[post.id] ? "opacity-50 cursor-not-allowed" : ""}`}>
                        <FaHeart
                          className={
                            likedPosts[post.id]?.liked ? "text-red-500" : ""
                          }
                        />
                        {loading[post.id] ?
                          "..."
                        : `${likedPosts[post.id]?.count || post.likes || 0} Likes`
                        }
                      </button>

                      <Link
                        to={`/blog/${post.id}`}
                        className="inline-flex items-center text-blue-600 font-medium">
                        Read More
                        <svg
                          className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </Link>
                    </div>

                    {/* Tags */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {post.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {filteredPosts.length === 0 && (
              <div className="text-center py-16">
                <p className="text-gray-500 text-lg">
                  No posts found in this category.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Blog;
