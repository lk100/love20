import React from "react";
import { Link } from "react-router-dom";

const PostItem = ({ post }) => {
  return (
    <div style={{ padding: "10px", borderBottom: "1px solid #ddd", background: "#fff" }}>
      <Link to={`/post/${post.id}`} style={{ textDecoration: "none", color: "black" }}>
        <h3>{post.title}</h3>
      </Link>
      <p>{post.body}</p>
    </div>
  );
};

export default PostItem;
