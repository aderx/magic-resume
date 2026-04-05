import { toast } from "sonner";
import { getFontFaceCss, normalizeFontFamily } from "@/utils/fonts";
import { getOptimizedStyles, optimizeImages } from "@/utils/export";

const IMAGE_EXPORT_SCALE = 2;

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(url);
};

const prepareElementForImageExport = async (
  element: HTMLElement,
  fontFamily?: string
) => {
  const clonedElement = element.cloneNode(true) as HTMLElement;
  const selectedFontFamily = normalizeFontFamily(fontFamily);
  const transformValue = clonedElement.style.transform || "";
  const scaleMatch = transformValue.match(/scale\(([\d.]+)\)/);

  if (scaleMatch) {
    const scale = Number(scaleMatch[1]);
    if (Number.isFinite(scale) && scale > 0 && scale < 1) {
      clonedElement.style.removeProperty("transform");
      clonedElement.style.removeProperty("transform-origin");
      clonedElement.style.setProperty("width", "100%", "important");
      clonedElement.style.setProperty("zoom", String(scale));
    }
  }

  clonedElement.style.setProperty("width", "100%", "important");
  clonedElement.style.setProperty("box-sizing", "border-box");
  clonedElement.style.setProperty("font-family", selectedFontFamily, "important");
  clonedElement.style.setProperty("background", "white", "important");

  const pageBreakLines = clonedElement.querySelectorAll<HTMLElement>(".page-break-line");
  pageBreakLines.forEach((line) => {
    line.style.display = "none";
  });

  await optimizeImages(clonedElement);

  const [capturedStyles, fontFaceStyles] = await Promise.all([
    getOptimizedStyles(),
    getFontFaceCss(selectedFontFamily, true),
  ]);

  const mountNode = document.createElement("div");
  mountNode.style.position = "fixed";
  mountNode.style.left = "-100000px";
  mountNode.style.top = "0";
  mountNode.style.width = "210mm";
  mountNode.style.background = "white";
  mountNode.style.zIndex = "-1";
  mountNode.style.pointerEvents = "none";

  const styleTag = document.createElement("style");
  styleTag.textContent = `
    ${fontFaceStyles}
    ${capturedStyles}
    html, body {
      background: white !important;
      background-color: white !important;
    }
    #local-image-export-root,
    #local-image-export-root * {
      font-family: ${selectedFontFamily} !important;
    }
    #local-image-export-root {
      width: 210mm;
      background: white !important;
      background-color: white !important;
    }
  `;

  clonedElement.id = "local-image-export-root";
  mountNode.appendChild(styleTag);
  mountNode.appendChild(clonedElement);
  document.body.appendChild(mountNode);

  return {
    mountNode,
    exportElement: clonedElement,
  };
};

const waitForNextPaint = async () => {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
};

const renderElementToCanvas = async (element: HTMLElement) => {
  if ("fonts" in document) {
    await (document as Document & { fonts?: FontFaceSet }).fonts?.ready;
  }
  await waitForNextPaint();
  const html2canvas = (await import("html2canvas")).default;

  return html2canvas(element, {
    backgroundColor: "#ffffff",
    scale: IMAGE_EXPORT_SCALE,
    useCORS: true,
    allowTaint: false,
    imageTimeout: 15000,
    logging: false,
    width: Math.max(1, Math.ceil(element.scrollWidth)),
    height: Math.max(1, Math.ceil(element.scrollHeight)),
    windowWidth: Math.max(1, Math.ceil(element.scrollWidth)),
    windowHeight: Math.max(1, Math.ceil(element.scrollHeight)),
  });
};

const exportCanvasToImage = async (canvas: HTMLCanvasElement, title: string) => {
  const imageBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Unable to generate image blob"));
        return;
      }
      resolve(blob);
    }, "image/png");
  });

  downloadBlob(imageBlob, `${title}.png`);

  canvas.width = 0;
  canvas.height = 0;
};

export interface ExportToImageOptions {
  elementId: string;
  title: string;
  fontFamily?: string;
  onStart?: () => void;
  onEnd?: () => void;
  successMessage?: string;
  errorMessage?: string;
}

export const exportToImage = async ({
  elementId,
  title,
  fontFamily,
  onStart,
  onEnd,
  successMessage,
  errorMessage,
}: ExportToImageOptions) => {
  onStart?.();

  let mountNode: HTMLElement | null = null;

  try {
    const exportElement = document.querySelector<HTMLElement>(`#${elementId}`);
    if (!exportElement) {
      throw new Error(`Export element #${elementId} not found`);
    }

    const prepared = await prepareElementForImageExport(exportElement, fontFamily);
    mountNode = prepared.mountNode;

    const canvas = await renderElementToCanvas(prepared.exportElement);
    await exportCanvasToImage(canvas, title || "resume");

    if (successMessage) {
      toast.success(successMessage);
    }
  } catch (error) {
    console.error("Image export error:", error);
    if (errorMessage) {
      toast.error(errorMessage);
    }
  } finally {
    if (mountNode && document.body.contains(mountNode)) {
      document.body.removeChild(mountNode);
    }
    onEnd?.();
  }
};
