export function fix_icon_size(element: HTMLElement): void {
  const img = new Image();

  const apply = () => {
    const h = element.getBoundingClientRect().height;
    element.style.width = `${h}px`;
    element.style.height = `${h}px`;
  };

  img.onload = apply;
  // index-and-output.js:11 — data-src is always present on fix-icon-size elements
  img.src = element.getAttribute('data-src')!;

  if (img.complete) {
    apply();
  }
}

export function process_card_generated_front(container: ParentNode = document): void {
  container.querySelectorAll<HTMLElement>('[data-onload="fix-icon-size"]').forEach(fix_icon_size);
}
