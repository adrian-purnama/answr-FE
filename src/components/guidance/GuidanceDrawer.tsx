import { Trash2 } from 'lucide-react'
import GuidanceContentEditor from '#/components/guidance/GuidanceContentEditor'
import DrawerDetails from '#/components/ui/DrawerDetails'
import SideDrawer from '#/components/ui/SideDrawer'
import { GUIDANCE_TITLE_MAX, type Guidance } from '#/lib/guidance'
import { buttonOutlineClassName } from '#/lib/ui-classes'
import { cn } from '#/lib/utils'

type GuidanceDrawerProps = {
  open: boolean
  onClose: () => void
  apiKeyId: string
  guidance: Guidance | null
  contentDraft: string
  onContentDraftChange: (value: string) => void
  maxCharacters: number
  onSaveTitle: (title: string) => void | Promise<void>
  onSaveContent: (content: string) => void | Promise<void>
  onToggleEnabled: () => void | Promise<void>
  onDelete: () => void
}

function StatusPill({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium',
        enabled
          ? 'bg-emerald-50 text-emerald-800'
          : 'bg-[var(--surface)] text-[var(--muted)]',
      )}
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          enabled ? 'bg-emerald-500' : 'bg-[var(--muted)]',
        )}
      />
      {enabled ? 'Enabled' : 'Disabled'}
    </span>
  )
}

export default function GuidanceDrawer({
  open,
  onClose,
  apiKeyId,
  guidance,
  contentDraft,
  onContentDraftChange,
  maxCharacters,
  onSaveTitle,
  onSaveContent,
  onToggleEnabled,
  onDelete,
}: GuidanceDrawerProps) {
  const editable = Boolean(guidance?.enabled)

  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      label="Guidance"
      size="lg"
      statusLabel={
        guidance ? <StatusPill enabled={guidance.enabled} /> : null
      }
      details={
        guidance ? (
          <DrawerDetails
            createdAt={guidance.createdAt}
            updatedAt={guidance.updatedAt}
            createdBy={guidance.createdBy}
            updatedBy={guidance.updatedBy}
            statusRows={[
              {
                label: 'Enable',
                value: <StatusPill enabled={guidance.enabled} />,
              },
            ]}
            actions={
              <>
                <button
                  type="button"
                  className={cn(
                    buttonOutlineClassName,
                    'w-full text-xs',
                    !guidance.enabled &&
                      'bg-[var(--surface)] text-[var(--ink)]',
                  )}
                  onClick={() => void onToggleEnabled()}
                >
                  {guidance.enabled ? 'Disable' : 'Enable'}
                </button>
                <button
                  type="button"
                  className={cn(
                    buttonOutlineClassName,
                    'w-full text-xs text-red-600 hover:bg-red-50 hover:text-red-700',
                  )}
                  onClick={onDelete}
                >
                  <Trash2 className="mr-1.5 inline size-3.5" aria-hidden />
                  Delete guidance
                </button>
              </>
            }
          />
        ) : null
      }
    >
      {guidance && (
        <div
          className={cn(
            'min-w-0 overflow-x-hidden break-words transition-opacity',
            !editable && 'opacity-90',
          )}
        >
          {!editable && (
            <p className="mb-6 rounded-md bg-[var(--surface)] px-3 py-2 text-sm text-[var(--muted)]">
              This guidance is disabled    content is read-only. Enable it to
              edit.
            </p>
          )}

          {editable ? (
            <input
              aria-label="Guidance title"
              className={cn(
                'w-full min-w-0 border-0 bg-transparent p-0 text-3xl font-semibold tracking-tight text-[var(--ink)] outline-none',
                'placeholder:text-[var(--muted)]/50',
              )}
              defaultValue={guidance.title}
              key={`${guidance.id}-title-${guidance.title}`}
              placeholder="Untitled"
              maxLength={GUIDANCE_TITLE_MAX}
              onBlur={(e) => void onSaveTitle(e.target.value)}
            />
          ) : (
            <h1 className="break-words text-3xl font-semibold tracking-tight text-[var(--ink)]">
              {guidance.title}
            </h1>
          )}

          <div className="mt-6 min-w-0">
            <GuidanceContentEditor
              apiKeyId={apiKeyId}
              contentKey={guidance.id}
              value={contentDraft}
              canEdit={editable}
              maxCharacters={maxCharacters}
              onDraftChange={onContentDraftChange}
              onSave={(text) => {
                onContentDraftChange(text)
                return onSaveContent(text)
              }}
            />
          </div>
        </div>
      )}
    </SideDrawer>
  )
}
