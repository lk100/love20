import React from "react";

const Navbar = ({ searchTerm, setSearchTerm }) => {
  return (
    <div style={{ padding: "10px", background: "#333", color: "#fff" }}>
      <input
        type="text"
        placeholder="Search posts..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ padding: "5px", width: "200px" }}
      />
    </div>
  );
};

export default Navbar;
