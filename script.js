const experienceCards = Array.from(document.querySelectorAll(".experience-card"));
const revealTargets = Array.from(document.querySelectorAll(".scroll-reveal"));
const inPageLinks = Array.from(document.querySelectorAll('a[href^="#"]'));
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const siteHeader = document.querySelector(".site-header");
const topSky = document.querySelector(".top-sky");
let lastScrollY = window.scrollY;

function initTopSkyStarfield() {
  if (!topSky) {
    return;
  }

  const canvas = topSky.querySelector(".top-sky__canvas");

  if (!(canvas instanceof HTMLCanvasElement)) {
    return;
  }

  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  const colors = [
    "255, 255, 255",
    "255, 255, 255",
    "103, 215, 255",
    "243, 181, 108",
  ];

  let stars = [];
  let width = 0;
  let height = 0;
  let rafId = 0;
  let lastTimestamp = 0;
  let isVisible = true;

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function createStar() {
    const size = randomBetween(0.9, 2.2);
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      size,
      speed: randomBetween(12, 30),
      alpha: randomBetween(0.35, 0.92),
      color: colors[Math.floor(Math.random() * colors.length)],
    };
  }

  function buildStars() {
    const starCount = Math.max(42, Math.min(Math.round((width * height) / 24000), 88));
    stars = Array.from({ length: starCount }, createStar);
  }

  function resizeCanvas() {
    const rect = topSky.getBoundingClientRect();
    const nextWidth = Math.max(1, Math.round(rect.width));
    const nextHeight = Math.max(1, Math.round(rect.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    width = nextWidth;
    height = nextHeight;
    canvas.width = Math.round(nextWidth * dpr);
    canvas.height = Math.round(nextHeight * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    buildStars();
    renderFrame();
  }

  function drawStar(star) {
    context.fillStyle = `rgba(${star.color}, ${star.alpha})`;
    context.fillRect(star.x, star.y, star.size, star.size);
  }

  function renderFrame() {
    context.clearRect(0, 0, width, height);
    stars.forEach(drawStar);
  }

  function updateStars(deltaSeconds) {
    stars.forEach((star) => {
      star.y += star.speed * deltaSeconds;

      if (star.y - star.size > height) {
        star.x = Math.random() * width;
        star.y = -randomBetween(12, 48);
      }
    });
  }

  function shouldAnimate() {
    return !prefersReducedMotion.matches && isVisible && document.visibilityState === "visible";
  }

  function stopAnimation() {
    if (!rafId) {
      return;
    }

    cancelAnimationFrame(rafId);
    rafId = 0;
    lastTimestamp = 0;
  }

  function animate(timestamp) {
    if (!shouldAnimate()) {
      stopAnimation();
      renderFrame();
      return;
    }

    if (!lastTimestamp) {
      lastTimestamp = timestamp;
    }

    const deltaSeconds = Math.min(timestamp - lastTimestamp, 40) / 1000;
    lastTimestamp = timestamp;

    updateStars(deltaSeconds);
    renderFrame();
    rafId = window.requestAnimationFrame(animate);
  }

  function syncAnimation() {
    if (shouldAnimate()) {
      if (!rafId) {
        rafId = window.requestAnimationFrame(animate);
      }

      return;
    }

    stopAnimation();
    renderFrame();
  }

  const visibilityObserver = new IntersectionObserver(
    ([entry]) => {
      isVisible = Boolean(entry?.isIntersecting);
      syncAnimation();
    },
    {
      threshold: 0,
    },
  );

  visibilityObserver.observe(topSky);

  window.addEventListener("resize", resizeCanvas, { passive: true });
  document.addEventListener("visibilitychange", syncAnimation);
  prefersReducedMotion.addEventListener("change", syncAnimation);

  resizeCanvas();
  syncAnimation();
}

function getScrollTarget(target) {
  if (target.id === "top") {
    return 0;
  }

  const absoluteTop = window.scrollY + target.getBoundingClientRect().top;
  const viewportHeight = window.innerHeight;
  const sectionHeight = target.offsetHeight;
  const headerOffset = siteHeader ? siteHeader.offsetHeight + 32 : 92;

  if (sectionHeight <= viewportHeight * 0.82) {
    const centeredTop =
      absoluteTop - (viewportHeight - sectionHeight) / 2 - headerOffset / 3;
    return Math.max(centeredTop, 0);
  }

  return Math.max(absoluteTop - headerOffset, 0);
}

function setPanelState(card, isOpen) {
  const button = card.querySelector(".experience-toggle");
  const panel = card.querySelector(".experience-panel");

  if (!button || !panel) {
    return;
  }

  card.classList.toggle("is-open", isOpen);
  button.setAttribute("aria-expanded", String(isOpen));

  if (isOpen) {
    panel.style.maxHeight = `${panel.scrollHeight}px`;
  } else {
    panel.style.maxHeight = "0px";
  }
}

function closeOtherCards(activeCard) {
  experienceCards.forEach((card) => {
    if (card !== activeCard) {
      setPanelState(card, false);
    }
  });
}

experienceCards.forEach((card) => {
  const button = card.querySelector(".experience-toggle");

  if (!button) {
    return;
  }

  setPanelState(card, false);

  button.addEventListener("click", () => {
    const isOpen = card.classList.contains("is-open");

    if (isOpen) {
      setPanelState(card, false);
      return;
    }

    closeOtherCards(card);
    setPanelState(card, true);
  });
});

window.addEventListener("resize", () => {
  experienceCards.forEach((card) => {
    if (card.classList.contains("is-open")) {
      setPanelState(card, true);
    }
  });
});

function syncHeaderScrollState() {
  const currentScrollY = window.scrollY;

  document.body.classList.toggle("is-scrolled", currentScrollY > 12);

  if (!siteHeader || currentScrollY <= 24) {
    document.body.classList.remove("is-header-hidden");
    lastScrollY = currentScrollY;
    return;
  }

  if (currentScrollY > lastScrollY + 4) {
    document.body.classList.add("is-header-hidden");
  } else if (currentScrollY < lastScrollY - 2) {
    document.body.classList.remove("is-header-hidden");
  }

  lastScrollY = currentScrollY;
}

window.addEventListener("scroll", syncHeaderScrollState, { passive: true });
syncHeaderScrollState();

inPageLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const href = link.getAttribute("href");

    if (!href || href === "#") {
      return;
    }

    const target = document.querySelector(href);

    if (!target) {
      return;
    }

    event.preventDefault();
    link.blur();
    document.body.classList.remove("is-header-hidden");

    window.scrollTo({
      top: getScrollTarget(target),
      behavior: prefersReducedMotion.matches ? "auto" : "smooth",
    });

    history.pushState(null, "", href);
  });
});

const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  },
  {
    rootMargin: "0px 0px -12% 0px",
    threshold: 0.18,
  },
);

revealTargets.forEach((target, index) => {
  target.style.transitionDelay = `${Math.min(index, 5) * 80}ms`;
  revealObserver.observe(target);
});

initTopSkyStarfield();
