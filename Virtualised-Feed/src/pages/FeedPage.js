import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useVirtualizer } from "@tanstack/react-virtual";
import axios from "axios";

const API_KEY = "7993c3d8-0a6b-4e47-b296-5a6b45fee98f";
const API_URL = `https://content.guardianapis.com/search?api-key=${API_KEY}&show-fields=thumbnail,bodyText&page-size=10&page=`;

const FeedPage = () => {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrollPos, setScrollPos] = useState(0);
  const containerRef = useRef(null);

  // Fetch posts with infinite scroll
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}${page}`);
      setPosts((prev) => [...prev, ...response.data.response.results]);
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, [page]);

  // Infinite scrolling with IntersectionObserver
  const observer = useRef(null);
  const lastPostRef = useRef(null);

  useEffect(() => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setPage((prev) => prev + 1);
      }
    });

    if (lastPostRef.current) observer.current.observe(lastPostRef.current);
  }, [loading]);

  // Save and restore scroll position
  useEffect(() => {
    window.scrollTo(0, scrollPos);
    return () => {
      setScrollPos(window.scrollY);
    };
  }, []);

  // Filter posts based on search query
  const filteredPosts = posts.filter((post) =>
    post.webTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div ref={containerRef} style={{ padding: "20px", maxWidth: "800px", margin: "auto" }}>
      <h1>Virtualized Feed</h1>

      {/* 🔹 Search Bar */}
      <input
        type="text"
        placeholder="Search posts..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ width: "100%", padding: "10px", fontSize: "16px", marginBottom: "20px" }}
      />

      {/* 🔹 Render Filtered Posts */}
      {filteredPosts.map((post, index) => (
        <div
          key={post.id}
          ref={index === filteredPosts.length - 1 ? lastPostRef : null}
          style={{ padding: "10px", borderBottom: "1px solid #ddd" }}
        >
          {post.fields?.thumbnail && <img src={post.fields.thumbnail} alt="Thumbnail" style={{ width: "100%", height: "auto" }} />}
          <h2 style={{ fontSize: "18px" }}>
            <Link to={`/post/${post.id}`} style={{ textDecoration: "none", color: "black" }}>
              {post.webTitle}
            </Link>
          </h2>
          <p>{post.fields?.bodyText.slice(0, 100)}...</p>
        </div>
      ))}

      {loading && <p>Loading more posts...</p>}
    </div>
  );
};

export default FeedPage;
