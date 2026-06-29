function svg(text: string) {
  const encoded = encodeURIComponent(text);

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480" viewBox="0 0 480 480">`,
    `<rect width="480" height="480" fill="#fff"/>`,
    `<rect x="32" y="32" width="96" height="96" fill="#000"/>`,
    `<rect x="352" y="32" width="96" height="96" fill="#000"/>`,
    `<rect x="32" y="352" width="96" height="96" fill="#000"/>`,
    `<path d="M176 64h32v32h-32zm64 0h32v32h-32zm64 0h32v32h-32zM176 128h96v32h-96zm128 0h32v64h-32zM160 208h32v32h-32zm64 0h32v32h-32zm64 0h64v32h-64zm96 0h32v64h-32zM160 272h96v32h-96zm128 0h32v64h-32zm64 32h96v32h-96zM160 352h32v96h-32zm64 0h64v32h-64zm96 32h32v64h-32zm64 0h64v32h-64z" fill="#000"/>`,
    `<text x="240" y="250" text-anchor="middle" font-family="monospace" font-size="12" fill="#111">${encoded.slice(0, 36)}</text>`,
    `</svg>`,
  ].join("");
}

export class SandboxQrGenerator {
  createBase64(payload: string) {
    return `data:image/svg+xml;base64,${Buffer.from(svg(payload)).toString("base64")}`;
  }
}
