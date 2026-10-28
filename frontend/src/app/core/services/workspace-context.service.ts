import { Injectable, computed, signal } from '@angular/core';

/**
 * Holds the active workspace selection. The id is sent as `X-Workspace-ID` on API calls.
 * It is only a context selector: the backend verifies membership on every request.
 * The workspace switcher (milestone M1) will set this value.
 */
@Injectable({ providedIn: 'root' })
export class WorkspaceContextService {
  private readonly activeWorkspaceIdState = signal<string | null>(null);

  readonly activeWorkspaceId = this.activeWorkspaceIdState.asReadonly();
  readonly hasActiveWorkspace = computed(() => this.activeWorkspaceIdState() !== null);

  setActiveWorkspace(workspaceId: string | null): void {
    this.activeWorkspaceIdState.set(workspaceId);
  }
}
