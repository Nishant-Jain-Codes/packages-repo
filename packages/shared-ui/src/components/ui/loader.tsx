import React, { useEffect } from "react";

import "./loader.css";

const Loader = () => {
  useEffect(() => {
    // Ensure styles are injected only once
    if (!document.getElementById("loader-styles")) {
      const style = document.createElement("style");
      style.id = "loader-styles";
      style.textContent = `
        @keyframes loaderDots {
          0%, 20% { content: ""; }
          40% { content: "."; }
          60% { content: ".."; }
          80%, 100% { content: "..."; }
        }
        .loader-dots::after {
          content: "";
          animation: loaderDots 1.5s steps(4, end) infinite;
        }
        @keyframes logoPulse {
          0%, 100% { 
            opacity: 1;
            transform: scale(1);
          }
          50% { 
            opacity: 0.8;
            transform: scale(0.98);
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div className="loader-container">
      <div className="loader-content">
        {/* Logo with pulse animation */}
        <div className="loader-logo-wrapper">
          <img
            src={SalescodeLogo}
            alt="Salescode Logo"
            className="loader-logo"
          />
        </div>
        
        {/* Loading text */}
        <p className="loader-text">
          Loading request<span className="loader-dots"></span>
        </p>
      </div>
    </div>
  );
};

export default Loader;
