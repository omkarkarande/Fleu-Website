"use strict";
// Real image links remain usable when JavaScript or dialog support is absent.
const dialog = document.querySelector("#screenshot-dialog");
if (dialog && typeof dialog.showModal === "function") {
  const image = dialog.querySelector("#dialog-image");
  const caption = dialog.querySelector("#dialog-caption");
  const close = dialog.querySelector(".dialog-close");
  let opener;
  document.querySelectorAll("[data-zoom]").forEach((link) => {
    link.setAttribute("aria-haspopup", "dialog");
    link.addEventListener("click", (event) => {
      if (
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0
      )
        return;
      event.preventDefault();
      opener = link;
      image.src = link.href;
      image.alt = link.querySelector("img").alt;
      caption.textContent = link.dataset.caption;
      dialog.showModal();
      dialog.scrollTop = 0;
      document.body.classList.add("dialog-open");
      close.focus();
    });
  });
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    const rect = dialog.getBoundingClientRect();
    if (
      event.target === dialog &&
      (event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom)
    )
      dialog.close();
  });
  dialog.addEventListener("close", () => {
    document.body.classList.remove("dialog-open");
    if (opener) opener.focus({ preventScroll: true });
  });
}
