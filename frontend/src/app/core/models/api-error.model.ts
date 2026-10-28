/** Standard error envelope returned by the API (API Design §15.2). */
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details: Record<string, unknown>;
    request_id: string | null;
  };
}
