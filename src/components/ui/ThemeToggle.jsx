import React, { useState, useEffect } from 'react';

export const ThemeToggle = () => {
  // List of available themes
  const themes = ["light", "dark"];
  
  // Initialize theme state from localStorage
  const [currentTheme, setCurrentTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme && themes.includes(savedTheme) ? savedTheme : "light";
  });

  // Update theme in localStorage and apply to document
  const applyTheme = (theme) => {
    setCurrentTheme(theme);
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.remove(...themes);
    document.documentElement.classList.add(theme);
  };

  // Initialize theme on component mount
  useEffect(() => {
    applyTheme(currentTheme);
  }, []);

  return (
    <div className="dropdown dropdown-top dropdown-end sm:dropdown-right w-full">
      <div tabIndex={0} role="button" className="btn btn-ghost w-full sm:justify-start gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-2xl border-none shadow-none bg-primary/10 text-primary h-auto min-h-0">
        <span
          className="inline-block w-2 h-2 rounded-full animate-pulse shrink-0"
          style={{
            backgroundColor: currentTheme === "dark" ? "#D0BCFF" : "#6750A4",
            boxShadow: `0 0 10px ${currentTheme === "dark" ? "#D0BCFF" : "#6750A4"}`
          }}
        />
        <span className="text-[10px] sm:text-xs uppercase font-bold tracking-widest flex-1 text-left">
          {currentTheme === "dark" ? "Dark mode" : "Light mode"}
        </span>
        <svg
          width="12"
          height="12"
          className="h-3 w-3 fill-current opacity-40 shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 2048 2048"
        >
          <path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"></path>
        </svg>
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content z-[9999] mb-2 p-2 shadow-2xl bg-base-300 rounded-[1.5rem] w-52 sm:w-full border border-base-content/10 backdrop-blur-xl"
      >
        {themes.map((theme) => (
          <li key={theme}>
            <button
              onClick={() => applyTheme(theme)}
              className={`flex items-center justify-between w-full px-4 py-3 rounded-xl hover:bg-primary/10 transition-colors ${currentTheme === theme ? 'text-primary font-bold bg-primary/5' : ''}`}
            >
              <span className="capitalize">{theme}</span>
              {currentTheme === theme && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ThemeToggle;