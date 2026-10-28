/** Response of GET /api/v1/health/ */
export interface HealthResponse {
  status: 'ok';
  application: string;
}
