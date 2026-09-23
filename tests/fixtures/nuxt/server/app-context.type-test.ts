import type { AppContextModule } from "./types/app-context"

/** Verify provider inference through the server declaration's app import. */
export function checkAppContext(context: ReturnType<AppContextModule["readAppRequestContext"]>) {
  const title: string = context.title
  const path: string = context.path
  // @ts-expect-error The inferred title must remain a string in the server program.
  const invalidTitle: number = context.title
  // @ts-expect-error The provider does not return a missing field.
  void context.missing
  void title
  void path
  void invalidTitle
}
