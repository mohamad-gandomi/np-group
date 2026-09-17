"use client";

import { useConfig, useDocumentInfo } from "@payloadcms/ui";
import type { DefaultCellComponentProps } from "payload";

type ExportFileData = {
  filename?: unknown;
  url?: unknown;
};

const getExportFile = (data: ExportFileData | null | undefined) => {
  const url = typeof data?.url === "string" ? data.url : null;
  const filename = typeof data?.filename === "string" ? data.filename : "nilper-export.json";
  return { filename, url };
};

function DownloadLink({ filename, url }: { filename: string; url: string }) {
  return (
    <a
      className="nilper-export-download"
      download={filename}
      href={url}
      onClick={(event) => event.stopPropagation()}
    >
      دانلود فایل
    </a>
  );
}

export function ExportNameCell({ cellData, rowData }: DefaultCellComponentProps) {
  const {
    config: { routes },
  } = useConfig();
  const file = getExportFile(rowData);
  const name = typeof cellData === "string" ? cellData : "خروجی داده";
  const recordURL = `${routes.admin}/collections/exports/${encodeURIComponent(String(rowData.id))}`;

  return (
    <div className="nilper-export-name-cell">
      <a className="nilper-export-name-cell__name" href={recordURL}>
        {name}
      </a>
      {file.url ? (
        <DownloadLink {...file} url={file.url} />
      ) : (
        <span className="nilper-export-pending">در انتظار پردازش</span>
      )}
    </div>
  );
}

export function ExportDownloadControl() {
  const { data, id } = useDocumentInfo();
  if (!id) return null;

  const file = getExportFile(data);
  return file.url ? (
    <DownloadLink {...file} url={file.url} />
  ) : (
    <span className="nilper-export-pending nilper-export-pending--control">
      فایل هنوز در صف پردازش است
    </span>
  );
}

export function HiddenExportUpload() {
  return null;
}
