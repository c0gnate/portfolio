(() => {
  const imagePattern = /\.(avif|gif|jpe?g|png|webp)$/i;

  const parseFallbacks = (gallery) => {
    return (gallery.dataset.galleryFiles || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const getDirectoryImages = async (folder) => {
    if (!folder || window.location.protocol === "file:") return [];

    try {
      const response = await fetch(folder);
      if (!response.ok) return [];
      const html = await response.text();
      const documentFragment = new DOMParser().parseFromString(html, "text/html");

      return Array.from(documentFragment.querySelectorAll("a"))
        .map((link) => link.getAttribute("href") || "")
        .map((href) => decodeURIComponent(href.split("?")[0].split("#")[0]))
        .filter((href) => imagePattern.test(href))
        .map((href) => new URL(href, new URL(folder, window.location.href)).href);
    } catch {
      return [];
    }
  };

  const getImageSrc = (src) => {
    try {
      const url = new URL(src, window.location.href);
      url.pathname = url.pathname
        .split("/")
        .map((part) => encodeURIComponent(decodeURIComponent(part)))
        .join("/");
      return url.href;
    } catch {
      return src;
    }
  };

  const buildGallery = (gallery, files) => {
    gallery.textContent = "";

    if (!files.length) {
      const empty = document.createElement("p");
      empty.className = "gallery-empty";
      empty.textContent = "Add images to this project's asset folder.";
      gallery.appendChild(empty);
      return;
    }

    const track = document.createElement("div");
    track.className = "gallery-track";

    const rows = [[], []];
    files.forEach((file, index) => {
      rows[index % rows.length].push(file);
    });

    rows.forEach((rowFiles) => {
      if (!rowFiles.length) return;

      const row = document.createElement("div");
      row.className = "gallery-row";

      [...rowFiles, ...rowFiles].forEach((src) => {
      const frame = document.createElement("figure");
      frame.className = "gallery-item";

      const image = document.createElement("img");
      image.src = getImageSrc(src);
      image.alt = "";
      image.loading = "lazy";

      const applyRatio = () => {
        if (!image.naturalWidth || !image.naturalHeight) return;
        frame.style.setProperty("--item-ratio", `${image.naturalWidth} / ${image.naturalHeight}`);
      };

      if (image.complete) {
        applyRatio();
      } else {
        image.addEventListener("load", applyRatio, { once: true });
      }

      frame.appendChild(image);
        row.appendChild(frame);
      });

      track.appendChild(row);
    });

    gallery.appendChild(track);
  };

  const enableManualWheel = (gallery) => {
    gallery.addEventListener("wheel", (event) => {
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (!delta) return;

      event.preventDefault();
      gallery.scrollLeft += delta;
    }, { passive: false });
  };

  const init = async () => {
    const galleries = Array.from(document.querySelectorAll("[data-gallery-folder]"));
    const manifest = window.PORTFOLIO_GALLERIES || {};

    await Promise.all(galleries.map(async (gallery) => {
      enableManualWheel(gallery);
      const folder = gallery.dataset.galleryFolder;
      const manifestFiles = Array.isArray(manifest[folder]) ? manifest[folder] : [];
      const discovered = await getDirectoryImages(folder);
      const fallbacks = parseFallbacks(gallery);
      buildGallery(gallery, discovered.length ? discovered : manifestFiles.length ? manifestFiles : fallbacks);
    }));
  };

  init();
})();
