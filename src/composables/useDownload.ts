import { useLogger } from "./useLogger";

interface DownloadOptions {
  filename: string;
  mimeType?: string;
}

export function useDownload() {
  var logger = useLogger("useDownload");

  function download(content: string, options: DownloadOptions): void {
    var mimeType = options.mimeType || "text/plain";
    var blob = new Blob([content], { type: mimeType });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");

    a.href = url;
    a.download = options.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    logger.debug("Downloaded file: " + options.filename);
  }

  function downloadJson(data: unknown, filename: string): void {
    var content = JSON.stringify(data, null, 2);
    download(content, {
      filename: filename.endsWith(".json") ? filename : filename + ".json",
      mimeType: "application/json",
    });
  }

  function downloadYaml(content: string, filename: string): void {
    download(content, {
      filename:
        filename.endsWith(".yaml") || filename.endsWith(".yml")
          ? filename
          : filename + ".yaml",
      mimeType: "text/yaml",
    });
  }

  function downloadPng(canvas: HTMLCanvasElement, filename: string): void {
    var url = canvas.toDataURL("image/png");
    var a = document.createElement("a");
    a.href = url;
    a.download = filename.endsWith(".png") ? filename : filename + ".png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    logger.debug("Downloaded PNG: " + filename);
  }

  return {
    download,
    downloadJson,
    downloadYaml,
    downloadPng,
  };
}
