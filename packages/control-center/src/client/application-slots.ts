/**
 * Application workspace seam slot types, mirrored from the DSH harness
 * `ui-layout` client source (application.navigation / application.surface).
 *
 * The RUNTIME slots come from the running harness; this augmentation only
 * makes the build self-contained against the published rc.7 contract
 * packages, whose ui-layout lacks the seam (it ships in the harness source
 * baseline `99f6f02` recorded in compatibility.ts).
 */

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
    /** Additive application-workspace navigation entries rendered by the sidebar shell. */
    'application.navigation': { kind: 'list'; scope: 'root'; owner: ApplicationNavigationOwnerProps }
    /** Keyed main application surfaces selected from application.navigation. */
    'application.surface': {
      kind: 'keyed'
      scope: 'root'
      owner: ApplicationSurfaceOwnerProps
    }
  }
}

/** Owner share supplied to every additive application navigation entry. */
export interface ApplicationNavigationOwnerProps {
  /** Whether the sidebar renders its wide form. */
  wide: boolean
  /** Stable id currently owning the main surface, or null for conversation. */
  activeId: string | null
  /** Select an application surface by the navigation entry's matching id. */
  select: (id: string) => void
}

/** Owner share of a selected additive application surface. */
export interface ApplicationSurfaceOwnerProps {
  /** Return to the native conversation surface. */
  close: () => void
}
