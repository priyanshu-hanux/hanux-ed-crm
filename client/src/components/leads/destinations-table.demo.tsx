import { useCallback, useEffect, useMemo, useState } from "react";
import { CircleDashed, Copy, Download, Edit, Eye, Trash2, Upload, UserCheck, UserPlus } from "lucide-react";

import {
  DataTable,
  type BulkActionOption,
  type DataTableAction,
  type DataTableBulkAction,
  type DataTableStates,
  type DataTableToolbarAction,
} from "@/components/table";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { dummyCandidates } from "@/data/dummy-candidates";
import type { CandidateRow } from "@/components/leads/table/candidate-row";
import { createDemoCandidateRow } from "@/components/leads/table/details/data/demo-lead-record";
import { CandidateDetails } from "@/components/leads/table/candidate-details";
import {
  candidateCardFields,
  candidateColumns,
  candidateSummary,
  CANDIDATE_SEARCH_COLUMNS,
  candidateSelectionPresets,
  DEFAULT_CANDIDATE_COLUMN_VISIBILITY,
} from "@/components/leads/table/candidate-columns";
import { LEAD_STATUS_CONFIG } from "@/components/leads/table/details/utils";
import type { LeadStatus } from "@/components/leads/table/details/types";

// Demo data for the bulk actions; in the app these come from the API
const EXECUTIVES: BulkActionOption[] = [
  "Rakesh Kumar", "Ananya Iyer", "Vikram Rao", "Priya Nair", "Arjun Malhotra", "Sneha Reddy", "Karan Mehta", "Divya Pillai",
].map((name) => ({ value: name, label: name, description: "Executive" }));

const STATUS_OPTIONS: BulkActionOption[] = (Object.keys(LEAD_STATUS_CONFIG) as LeadStatus[]).map((status) => ({
  value: status,
  label: LEAD_STATUS_CONFIG[status].label,
}));

/** "3 candidates" */
const plural = (count: number) => `${count} ${count === 1 ? "candidate" : "candidates"}`;

/** Stand-in for an API call */
const fakeRequest = () => new Promise((resolve) => setTimeout(resolve, 700));

// Set to true to test the error states
const SIMULATE_FAILURE = false;

const fetchCandidates = () =>
  new Promise<CandidateRow[]>((resolve, reject) =>
    setTimeout(() => {
      if (SIMULATE_FAILURE) reject(new Error("Couldn’t reach the server. Check your connection."));
      // Profiles joined with each lead's status and owner, as the list API would return them
      else resolve(dummyCandidates.map(createDemoCandidateRow));
    }, 800)
  );

export function CandidatesTableDemo() {
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detailsId, setDetailsId] = useState<string | null>(null);


  // The three numbers the table needs
  const totalItems = candidates.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  // If deleting rows removes the last page, step back to the new last page
  const currentPage = Math.min(page, totalPages);

  // First load
  useEffect(() => {
    let cancelled = false;
    fetchCandidates()
      .then((rows) => {
        if (!cancelled) setCandidates(rows);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Only the rows of the current page go to the table
  const pageData = useMemo(
    () =>
      candidates.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
      ),
    [candidates, currentPage, pageSize]
  );

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setPage(1); // the old page number may not exist at the new size
  }, []);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [candidateToDelete, setCandidateToDelete] =
    useState<CandidateRow | null>(null);

  const [columnVisibility, setColumnVisibility] =
    useState<Record<string, boolean>>(DEFAULT_CANDIDATE_COLUMN_VISIBILITY);

  // View opens the drawer instead of a toast
  const handleView = useCallback((candidate: CandidateRow) => {
    setDetailsId(String(candidate.id));
  }, []);


  const handleEdit = useCallback((candidate: CandidateRow) => {
    toast.info(`Edit candidate: ${candidate.name}`);
  }, []);

  const handleDelete = useCallback((candidate: CandidateRow) => {
    setCandidateToDelete(candidate);
    setDeleteDialogOpen(true);
  }, []);

  // The table drops deleted rows from its selection by itself, so nothing to update here.
  const confirmDelete = useCallback(() => {
    if (!candidateToDelete) return;

    setCandidates((prev) =>
      prev.filter((candidate) => candidate.id !== candidateToDelete.id)
    );

    toast.success("Candidate deleted successfully");
    setDeleteDialogOpen(false);
    setCandidateToDelete(null);
  }, [candidateToDelete]);



  // Refresh and retry; old rows stay visible while this runs
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const fresh = await fetchCandidates();
      setCandidates(fresh);
      setLoadError(null);
      toast.success("Candidates refreshed");
    } catch (err) {
      setLoadError(err); // the table shows the banner or the error state
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Table states: only what differs from the defaults. The empty state gets an "Add candidate"
  // button in front of the default "Refresh"; no matches / error / hidden columns use the defaults.
  const tableStates = useMemo<DataTableStates>(
    () => ({
      empty: ({ defaults }) => ({
        description: "Upload a resume or add a candidate by hand to get started.",
        actions: [
          { label: "Add candidate", icon: UserPlus, variant: "default", onClick: () => toast.info("Add candidate") },
          ...(defaults.actions ?? []),
        ],
      }),
    }),
    []
  );

  // Operations on the selected rows (shown in the selection bar). The table only shows them and
  // calls onRun; here they change the demo data or show what an API call would do.
  const bulkActions = useMemo<DataTableBulkAction<CandidateRow>[]>(
    () => [
      {
        id: "assign",
        label: "Assign",
        icon: UserCheck,
        variant: "secondary",
        options: EXECUTIVES,
        optionsTitle: "Executive",
        onRun: async (rows, { option }) => {
          await fakeRequest();
          const ids = new Set(rows.map((candidate) => candidate.id));
          setCandidates((prev) =>
            prev.map((candidate) => (ids.has(candidate.id) ? { ...candidate, owner: option?.value ?? null } : candidate))
          );
          toast.success(`Assigned ${plural(rows.length)} to ${option?.label}`);
        },
      },
      {
        id: "status",
        label: "Status",
        icon: CircleDashed,
        variant: "secondary",
        options: STATUS_OPTIONS,
        optionsTitle: "Move to",
        onRun: async (rows, { option }) => {
          await fakeRequest();
          if (!option) return;
          const ids = new Set(rows.map((candidate) => candidate.id));
          setCandidates((prev) =>
            prev.map((candidate) =>
              ids.has(candidate.id) ? { ...candidate, status: option.value as LeadStatus } : candidate
            )
          );
          toast.success(`Moved ${plural(rows.length)} to ${option.label}`);
        },
      },
      {
        id: "export",
        label: "Export",
        icon: Download,
        variant: "secondary",
        // Keep the rows selected after downloading them
        clearSelectionAfter: false,
        onRun: (_rows, { exportCsv }) => exportCsv(),
      },
      {
        id: "delete",
        label: "Delete",
        icon: Trash2,
        variant: "secondary",
        // iconOnly: true,
        // Red tint on any look; the toolbar re-tints every variant from --dt-accent (styles/data-table.css)
        destructive: true,
        confirm: (rows) => ({
          title: `Delete ${plural(rows.length)}?`,
          description: (
            <span className="block space-y-2">
              <span className="block">This permanently removes:</span>
              <span className="block text-foreground">
                {rows.slice(0, 5).map((candidate) => candidate.name.trim() || "Unnamed candidate").join(", ")}
                {rows.length > 5 && ` and ${rows.length - 5} more`}
              </span>
            </span>
          ),
          confirmLabel: "Delete",
        }),
        onRun: (rows) => {
          const ids = new Set(rows.map((candidate) => candidate.id));
          setCandidates((prev) => prev.filter((candidate) => !ids.has(candidate.id)));
          toast.success(`Deleted ${plural(rows.length)}`);
        },
      },
    ],
    []
  );

  // Less frequent tools live in the toolbar's "More" (⋯) menu
  const toolbarActions = useMemo<DataTableToolbarAction[]>(
    () => [
      { id: "import", label: "Import from CSV", icon: Upload, group: "data", onSelect: () => toast.info("Import from CSV") },
      { id: "duplicates", label: "Find duplicates", icon: Copy, group: "data", onSelect: () => toast.info("Find duplicates") },
      { id: "resumes", label: "Bulk upload resumes", icon: Upload, group: "upload", onSelect: () => toast.info("Bulk upload resumes") },
    ],
    []
  );

  const actions = useMemo<DataTableAction<CandidateRow>[]>(
    () => [
      {
        label: "View",
        icon: Eye,
        onClick: handleView,
        variant: "ghost",
      },
      {
        label: "Edit",
        icon: Edit,
        onClick: handleEdit,
        variant: "ghost",
      },
      {
        label: "Delete",
        icon: Trash2,
        onClick: handleDelete,
        variant: "destructive",
      },
    ],
    [handleView, handleEdit, handleDelete]
  );

  return (
    <div className="w-full min-w-0 space-y-4">
      {/* <DataTable
        columns={candidateColumns}
        data={pageData}
        title="Candidates"
        description="Candidate profiles, skills, certifications, and extraction confidence"
        searchColumns={CANDIDATE_SEARCH_COLUMNS}
        searchPlaceholder="Search name, email, company, role..."
        actions={actions}
        onRowSelect={setSelectedCandidates}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        selectedItems={selectedCandidates}
        onBulkDelete={handleBulkDelete}
        stickyToolbar
        maxBodyHeight={400}
        stickyHeader={false}
        stickyOffset={0}
        persistKey="candidates-table"
        syncUrl
        cellBorders={true}
        cardFields={candidateCardFields}

        isLoading={isLoading}
        isRefreshing={isRefreshing}
        error={loadError}
        onRefresh={handleRefresh}

        serverSidePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={handlePageSizeChange}

        detailsRowId={detailsId}
        onDetailsRowIdChange={setDetailsId}
        getDetailsTitle={(candidate) => candidate.name || "Candidate"}
        getDetailsDescription={candidateSummary}
        renderDetails={(candidate) => (
          <CandidateDetails candidate={candidate} onEdit={handleEdit} onDelete={handleDelete} />
        )}
      /> */}

      <DataTable
        columns={candidateColumns}
        data={candidates}
        title="Candidates"
        description="Candidate profiles, skills, certifications, and extraction confidence"
        searchColumns={CANDIDATE_SEARCH_COLUMNS}
        searchPlaceholder="Search name, email, company, role..."
        itemName="candidate"
        states={tableStates}
        actions={actions}
        bulkActions={bulkActions}
        selectionPresets={candidateSelectionPresets}
        toolbarActions={toolbarActions}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        onRefresh={handleRefresh}
        isLoading={isLoading}
        error={loadError}
        isRefreshing={isRefreshing}
        stickyToolbar
        persistKey="candidates-table"
        syncUrl
        maxBodyHeight={400}
        stickyHeader={false}
        stickyOffset={0}
        cellBorders={true}
        pageSize={10}
        cardFields={candidateCardFields}

        detailsRowId={detailsId}
        onDetailsRowIdChange={setDetailsId}
        getDetailsTitle={(candidate) => candidate.name || "Candidate"}
        getDetailsDescription={candidateSummary}
        renderDetails={(candidate) => (
          <CandidateDetails candidate={candidate} onEdit={handleEdit} onDelete={handleDelete} />
        )}
      />

      {/* Single delete confirmation */}
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setCandidateToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete candidate?
            </AlertDialogTitle>

            <AlertDialogDescription>
              This will remove{" "}
              <strong>{candidateToDelete?.name}</strong> from the local
              demo data. This action cannot be undone.
            </AlertDialogDescription>

          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}