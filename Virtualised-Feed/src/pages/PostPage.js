import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API_KEY = "7993c3d8-0a6b-4e47-b296-5a6b45fee98f";
const API_URL = `https://content.guardianapis.com/`;

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API_URL}${id}?api-key=${API_KEY}&show-fields=thumbnail,bodyText`)
      .then((response) => {
        setPost(response.data.response.content);
        setLoading(false);
      })
      .catch((error) => console.error("Error fetching post details:", error));
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (!post) return <p>Post not found</p>;

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "auto" }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: "20px" }}>
        ← Back to Feed
      </button>
      {post.fields?.thumbnail && <img src={post.fields.thumbnail} alt="Thumbnail" style={{ width: "100%" }} />}
      <h1>{post.webTitle}</h1>
      <p>{post.fields?.bodyText}</p>
    </div>
  );
};

export default PostDetail;
