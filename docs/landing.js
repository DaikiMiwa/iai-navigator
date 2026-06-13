document.addEventListener("DOMContentLoaded", () => {
  // --- Theme Toggle Logic ---
  const themeToggleBtn = document.querySelector(".theme-toggle");
  
  const getPreferredTheme = () => {
    const savedTheme = localStorage.getItem("iai-theme");
    if (savedTheme) return savedTheme;
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  };

  const setTheme = (theme) => {
    if (theme === "light") {
      document.body.classList.remove("theme-dark");
      document.body.classList.add("theme-light");
    } else {
      document.body.classList.remove("theme-light");
      document.body.classList.add("theme-dark");
    }
    localStorage.setItem("iai-theme", theme);
  };

  setTheme(getPreferredTheme());

  themeToggleBtn.addEventListener("click", () => {
    const currentTheme = document.body.classList.contains("theme-light") ? "light" : "dark";
    setTheme(currentTheme === "light" ? "dark" : "light");
  });

  // --- Language Switcher Logic ---
  const langToggleBtn = document.querySelector(".lang-toggle");
  
  const getPreferredLanguage = () => {
    const savedLang = localStorage.getItem("iai-lang");
    if (savedLang) return savedLang;
    return navigator.language.startsWith("ja") ? "ja" : "en";
  };

  const setLanguage = (lang) => {
    if (lang === "ja") {
      document.body.classList.remove("lang-en");
      document.body.classList.add("lang-ja");
      
      // Update privacy links to Japanese version
      document.querySelectorAll("#header-privacy-link, #footer-privacy-link").forEach(el => {
        el.href = "https://github.com/DaikiMiwa/safari-keyboard-navigation-extension/blob/main/docs/ja/privacy-policy.md";
      });
    } else {
      document.body.classList.remove("lang-ja");
      document.body.classList.add("lang-en");
      
      // Update privacy links to English version
      document.querySelectorAll("#header-privacy-link, #footer-privacy-link").forEach(el => {
        el.href = "https://github.com/DaikiMiwa/safari-keyboard-navigation-extension/blob/main/docs/privacy-policy.md";
      });
    }
    localStorage.setItem("iai-lang", lang);
  };

  setLanguage(getPreferredLanguage());

  langToggleBtn.addEventListener("click", () => {
    const currentLang = document.body.classList.contains("lang-ja") ? "ja" : "en";
    setLanguage(currentLang === "ja" ? "en" : "ja");
  });

  // --- Setup Tabs Switcher ---
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabPanes = document.querySelectorAll(".tab-pane");

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetTab = btn.getAttribute("data-tab");
      
      tabButtons.forEach(b => b.classList.remove("active"));
      tabPanes.forEach(p => p.classList.remove("active"));
      
      btn.classList.add("active");
      document.getElementById(`tab-${targetTab}`).classList.add("active");
    });
  });

  // --- Interactive Simulator Logic ---
  const simulatorPage = document.getElementById("simulator-page");
  const simulatorGuide = document.getElementById("simulator-guide");
  const simToast = document.getElementById("sim-toast");
  
  if (simulatorPage && simulatorGuide && simToast) {
    let hintsVisible = false;
    const hintOverlays = [];

    const showSimulatorHints = () => {
      if (hintsVisible) return;
      
      // Find all mock elements with data-hint
      const targets = simulatorPage.querySelectorAll("[data-hint]");
      targets.forEach(target => {
        const hintChar = target.getAttribute("data-hint");
        
        // Create hint label span
        const hintSpan = document.createElement("span");
        hintSpan.className = "sim-hint";
        hintSpan.textContent = hintChar;
        
        // Position relative to target
        target.style.position = "relative";
        target.appendChild(hintSpan);
        
        hintOverlays.push({ element: target, overlay: hintSpan, char: hintChar });
      });

      simulatorGuide.style.display = "none";
      hintsVisible = true;
    };

    const hideSimulatorHints = () => {
      if (!hintsVisible) return;
      
      hintOverlays.forEach(item => {
        if (item.overlay && item.overlay.parentNode) {
          item.overlay.parentNode.removeChild(item.overlay);
        }
        item.element.classList.remove("sim-target-active");
      });
      
      hintOverlays.length = 0; // Clear array
      simulatorGuide.style.display = "block";
      hintsVisible = false;
    };

    const triggerTargetAction = (target) => {
      target.classList.add("sim-target-active");
      
      // Show success toast
      simToast.classList.add("show");
      setTimeout(() => {
        simToast.classList.remove("show");
      }, 1500);

      // Perform the mock action after a tiny delay
      setTimeout(() => {
        const id = target.getAttribute("id");
        if (id === "sim-link-features") {
          document.getElementById("features").scrollIntoView({ behavior: "smooth" });
        } else if (id === "sim-link-setup") {
          document.getElementById("setup").scrollIntoView({ behavior: "smooth" });
        } else if (id === "sim-link-github") {
          window.open(target.getAttribute("href"), "_blank");
        } else if (id === "sim-btn-demo") {
          // Just flash the button or add custom effect
          target.style.transform = "scale(0.95)";
          setTimeout(() => { target.style.transform = ""; }, 150);
        }
        hideSimulatorHints();
      }, 350);
    };

    // Keyboard Event Listener
    document.addEventListener("keydown", (e) => {
      // Ignore keypresses if typing inside editable fields (inputs/textareas)
      const activeEl = document.activeElement;
      if (activeEl && (
        activeEl.tagName === "INPUT" || 
        activeEl.tagName === "TEXTAREA" || 
        activeEl.isContentEditable
      )) {
        return;
      }

      const key = e.key;

      if (!hintsVisible) {
        // 'f' or 'F' opens hints
        if (key === "f" || key === "F") {
          e.preventDefault();
          showSimulatorHints();
        }
      } else {
        // Escape closes hints
        if (key === "Escape") {
          e.preventDefault();
          hideSimulatorHints();
          return;
        }

        // Check if key matches one of our active hints
        const match = hintOverlays.find(item => item.char.toLowerCase() === key.toLowerCase());
        if (match) {
          e.preventDefault();
          triggerTargetAction(match.element);
        } else {
          // Any other key closes hints
          hideSimulatorHints();
        }
      }
    });

    // Also support clicking the guide box to trigger hints on mobile/tablet (touch friendly!)
    simulatorGuide.addEventListener("click", (e) => {
      e.stopPropagation();
      showSimulatorHints();
    });

    // Close hints on clicking outside the mock window page
    document.addEventListener("click", (e) => {
      if (hintsVisible && !simulatorPage.contains(e.target)) {
        hideSimulatorHints();
      }
    });
  }
});
