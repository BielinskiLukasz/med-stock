export function SyncInstructions() {
  return (
    <div className="space-y-3 text-sm text-muted-foreground">
      <p>
        1. Use the &ldquo;Export backup&rdquo; button above to save a backup file to a shared folder (e.g., OneDrive, Google Drive, Dropbox).
      </p>
      <p>
        2. Share the link to the folder with your household member.
      </p>
      <p>
        3. Your household member opens this app on their device, downloads your backup file, and uses the &ldquo;Import backup&rdquo; button to restore it.
      </p>
      <p>
        4. To push your changes to your household member, export a new backup and they import it again. The most recent backup is the source of truth.
      </p>
      <p className="mt-2 text-xs">
        Note: All changes are manual. There is no automatic sync — each household member must explicitly export and import when sharing updates.
      </p>
    </div>
  )
}
