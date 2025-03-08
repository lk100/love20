import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import FeedPage from "./pages/FeedPage";
import PostPage from "./pages/PostPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FeedPage />} />
        <Route path="/post/:id" element={<PostPage />} />
      </Routes>
    </Router>
  );
}

export default App;
