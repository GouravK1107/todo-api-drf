(function () {
  // Theme toggle functionality
  const themeToggle = document.getElementById("themeToggle");
  const html = document.documentElement;

  // Check for saved theme preference
  const savedTheme = localStorage.getItem("theme") || "light";
  html.setAttribute("data-theme", savedTheme);

  themeToggle.addEventListener("click", () => {
    const currentTheme = html.getAttribute("data-theme");
    const newTheme = currentTheme === "light" ? "dark" : "light";

    html.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  });

  // Progress bar animation
  const bar = document.getElementById("progressBar");
  if (bar) {
    bar.style.width = "0%";
    void bar.offsetWidth;
    bar.style.width = "60%";
  }

  // Intersection observer for cards
  const cards = document.querySelectorAll(".feature-card, .step-item");
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          e.target.style.animation = `fadeUp 0.5s ${i * 0.1}s ease both`;
          obs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.15 },
  );
  cards.forEach((c) => obs.observe(c));
})();
