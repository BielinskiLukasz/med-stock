import { useLang } from '@/i18n'

export function SyncInstructions() {
  const { t } = useLang()
  return (
    <div className="space-y-3 text-sm text-muted-foreground">
      <p>
        {t('data.syncStep1')}
      </p>
      <p>
        {t('data.syncStep2')}
      </p>
      <p>
        {t('data.syncStep3')}
      </p>
      <p>
        {t('data.syncStep4')}
      </p>
      <p className="mt-2 text-xs">
        {t('data.syncNote')}
      </p>
    </div>
  )
}
