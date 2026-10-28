import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { isApiRequest } from '../services/api.service';
import { WorkspaceContextService } from '../services/workspace-context.service';

export const WORKSPACE_HEADER = 'X-Workspace-ID';

/** Sends the active workspace as context. The backend validates membership; this is not authorization. */
export const workspaceInterceptor: HttpInterceptorFn = (req, next) => {
  const workspaceId = inject(WorkspaceContextService).activeWorkspaceId();
  if (!workspaceId || !isApiRequest(req.url) || req.headers.has(WORKSPACE_HEADER)) {
    return next(req);
  }
  return next(req.clone({ setHeaders: { [WORKSPACE_HEADER]: workspaceId } }));
};
