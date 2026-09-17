"use client";

import {
  useConfig,
  useDocumentInfo,
  useFormFields,
} from "@payloadcms/ui";
import { useEffect, useState } from "react";

type PreviewDocument = Record<string, unknown>;

type PreviewResponse = {
  docs: PreviewDocument[];
  exportTotalDocs: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  page: number;
  totalPages: number;
};

type PreviewState = {
  error: string | null;
  isLoading: boolean;
  preview: PreviewResponse | null;
  requestKey: string;
};

const PREVIEW_LIMIT = 10;

export function ExportDataPreview() {
  const {
    config: { routes },
  } = useConfig();
  const { collectionSlug } = useDocumentInfo();
  const selectedOptions = useFormFields(([fields]) => ({
    collectionSlug: fields.collectionSlug?.value,
    draft: fields.drafts?.value,
    fields: fields.fields?.value,
    format: fields.format?.value,
    limit: fields.limit?.value,
    locale: fields.locale?.value,
    sort: fields.sort?.value,
    where: fields.where?.value,
  }));
  const optionsKey = JSON.stringify(selectedOptions);
  const [pagination, setPagination] = useState({ optionsKey, page: 1 });
  const page = pagination.optionsKey === optionsKey ? pagination.page : 1;
  const requestKey = `${optionsKey}:${page}`;
  const [previewState, setPreviewState] = useState<PreviewState>({
    error: null,
    isLoading: false,
    preview: null,
    requestKey: "",
  });
  const activePreviewState = previewState.requestKey === requestKey
    ? previewState
    : { error: null, isLoading: true, preview: null, requestKey };
  const { error, isLoading, preview } = activePreviewState;

  useEffect(() => {
    const exportOptions = JSON.parse(optionsKey) as typeof selectedOptions;
    if (!collectionSlug || typeof exportOptions.collectionSlug !== "string") {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setPreviewState({ error: null, isLoading: true, preview: null, requestKey });

      try {
        const response = await fetch(`${routes.api}/${collectionSlug}/export-preview`, {
          body: JSON.stringify({
            collectionSlug: exportOptions.collectionSlug,
            draft: exportOptions.draft,
            fields: exportOptions.fields,
            format: exportOptions.format,
            limit: exportOptions.limit,
            locale: exportOptions.locale,
            previewLimit: PREVIEW_LIMIT,
            previewPage: page,
            sort: exportOptions.sort,
            where: exportOptions.where,
          }),
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          method: "POST",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("پیش‌نمایش از سرور دریافت نشد.");
        }

        setPreviewState({
          error: null,
          isLoading: false,
          preview: await response.json() as PreviewResponse,
          requestKey,
        });
      } catch (caughtError) {
        if (!controller.signal.aborted) {
          setPreviewState({
            error: caughtError instanceof Error ? caughtError.message : "نمایش پیش‌نمایش ممکن نیست.",
            isLoading: false,
            preview: null,
            requestKey,
          });
        }
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [collectionSlug, optionsKey, page, requestKey, routes.api]);

  return (
    <section className="export-preview nilper-transfer-preview" dir="ltr" aria-live="polite">
      <div className="export-preview__header">
        <h3>پیش‌نمایش JSON</h3>
        {preview ? (
          <span className="export-preview__export-count">
            {preview.exportTotalDocs.toLocaleString("fa-IR")} رکورد
          </span>
        ) : null}
      </div>

      {isLoading ? <p className="nilper-transfer-preview__message">در حال آماده‌سازی پیش‌نمایش…</p> : null}
      {error ? <p className="nilper-transfer-preview__error">{error}</p> : null}

      {!isLoading && !error && preview ? (
        <pre className="nilper-transfer-preview__json">
          <code>{JSON.stringify(preview.docs, null, 2)}</code>
        </pre>
      ) : null}

      {preview && preview.totalPages > 1 ? (
        <div className="export-preview__pagination nilper-transfer-preview__pagination">
          <button
            type="button"
            className="nilper-transfer-preview__button"
            disabled={!preview.hasPrevPage || isLoading}
            onClick={() => setPagination({ optionsKey, page: Math.max(1, page - 1) })}
          >
            صفحه قبل
          </button>
          <span className="export-preview__page-info">
            صفحه {preview.page.toLocaleString("fa-IR")} از {preview.totalPages.toLocaleString("fa-IR")}
          </span>
          <button
            type="button"
            className="nilper-transfer-preview__button"
            disabled={!preview.hasNextPage || isLoading}
            onClick={() => setPagination({ optionsKey, page: page + 1 })}
          >
            صفحه بعد
          </button>
        </div>
      ) : null}
    </section>
  );
}
