/** Ids of the columns the table adds itself */
export const SELECT_COLUMN_ID = "select"
export const ACTIONS_COLUMN_ID = "actions"

/** Utility columns hold controls, not data: never exported, never listed in the column settings */
export const UTILITY_COLUMN_IDS: ReadonlySet<string> = new Set([SELECT_COLUMN_ID, ACTIONS_COLUMN_ID])

/** Default choices in the rows-per-page select */
export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

/** Delay between typing in the search box and filtering */
export const SEARCH_DEBOUNCE_MS = 200

/** Most skeleton rows shown while loading (when skeletonRows isn't set) */
export const MAX_SKELETON_ROWS = 10

/** Column resizing limits when a column doesn't set minSize / maxSize */
export const DEFAULT_MIN_COLUMN_SIZE = 40
export const DEFAULT_MAX_COLUMN_SIZE = 1000

/** Keyboard resizing step in px (Shift for the large step) */
export const RESIZE_STEP = 10
export const RESIZE_STEP_LARGE = 50

/** A select filter shows a search box when it has more options than this */
export const SELECT_FILTER_SEARCH_THRESHOLD = 6

/** How long the copy button shows its "copied" state */
export const COPIED_FEEDBACK_MS = 1500

/** Clicks on these elements inside a row keep their own behavior instead of opening the details drawer */
export const INTERACTIVE_SELECTOR =
    "button, a, input, select, textarea, label, [role='checkbox'], [role='menuitem'], [data-no-row-click]"

/** Keys typed into these elements are never treated as shortcuts */
export const EDITABLE_SELECTOR = "input, textarea, select, [contenteditable='true']"

/** localStorage */
export const STORAGE_PREFIX = "data-table"
/** Bump when the stored settings shape changes; older saved settings are then ignored */
export const SETTINGS_STORAGE_VERSION = 1
/** Bump when the stored views shape changes; older saved views are then ignored */
export const VIEWS_STORAGE_VERSION = 1

/** URL param for the toolbar search */
export const SEARCH_URL_PARAM = "q"
