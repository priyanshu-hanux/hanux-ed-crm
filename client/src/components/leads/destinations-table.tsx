// import { useCallback, useEffect, useMemo, useState } from "react";
// import { useNavigate } from "react-router";
// import { Edit, Trash2, Eye } from "lucide-react";
// import { Badge } from "@/components/ui/badge";
// import {
//   DataTable,
//   createSortableHeader,
//   type ColumnDef,
//   type DataTableAction,
// } from "@/components/leads/data-table";
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "@/components/ui/alert-dialog";
// import type { Destination } from "@/types/app-types";
// import { getLocationString, getStatus, getStatusColor, fetchDestinations, deleteDestination, formatPrice } from "@/components/leads/helpers";
// import { toast } from "sonner";
// import { images } from "@/assets";


// export function DestinationsTable() {
//   const navigate = useNavigate();
//   const [destinations, setDestinations] = useState<Destination[]>([]);
//   const [selectedDestinations, setSelectedDestinations] = useState<Destination[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
//   const [destinationToDelete, setDestinationToDelete] = useState<Destination | null>(null);
//   const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

//   // Pagination state
//   const [currentPage, setCurrentPage] = useState(1);
//   const [pageSize] = useState(10);
//   const [totalItems, setTotalItems] = useState(0);
//   const [totalPages, setTotalPages] = useState(0);

//   // Column visibility state
//   const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
//     name: true,
//     price: true,
//     short_description: true,
//     status: true,
//     country: false,
//     rating: false,
//     created_at: false,
//   })

//   // Fetch destinations function
//   const loadDestinations = async (isRefresh = false, page = currentPage) => {
//     try {
//       if (isRefresh) {
//         setRefreshing(true);
//       } else {
//         setLoading(true);
//       }
//       setError(null);
//       const response = await fetchDestinations({
//         page,
//         limit: pageSize,
//       });
//       setDestinations(response.data);
//       setTotalItems(response.pagination.total);
//       setTotalPages(response.pagination.totalPages);
//       setCurrentPage(response.pagination.page);
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Failed to load destinations');
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   // Refresh handler
//   const handleRefresh = () => {
//     loadDestinations(true);
//   };

//   // Pagination handlers
//   const handlePreviousPage = () => {
//     if (currentPage > 1) {
//       loadDestinations(false, currentPage - 1);
//     }
//   };

//   const handleNextPage = () => {
//     if (currentPage < totalPages) {
//       loadDestinations(false, currentPage + 1);
//     }
//   };

//   // Fetch destinations on component mount
//   useEffect(() => {
//     loadDestinations();
//   }, []); // eslint-disable-line react-hooks/exhaustive-deps

//   // Stable callback identities matter here: these feed the memoized
//   // `columns`/`actions` arrays below. TanStack Table v9 explicitly warns
//   // that recreating columns/options on every render can make the table
//   // "repeatedly invalidate ... and some adapters can enter render loops".
//   const handleEdit = useCallback((destination: Destination) => {
//     navigate(`/admin/destination/${destination.id}/edit`, { replace: true });
//   }, [navigate]);

//   const handleView = useCallback((destination: Destination) => {
//     navigate(`/admin/destination/${destination.id}`, { replace: true });
//   }, [navigate]);

//   const handleDelete = useCallback((destination: Destination) => {
//     setDestinationToDelete(destination);
//     setDeleteDialogOpen(true);
//   }, []);

//   const confirmDelete = async () => {
//     if (!destinationToDelete) return;

//     try {
//       await deleteDestination(destinationToDelete.id);
//       setDestinations(prev => prev.filter(d => d.id !== destinationToDelete.id));
//       // Remove from selected if it was selected
//       setSelectedDestinations(prev => prev.filter(d => d.id !== destinationToDelete.id));
//       toast.success('Destination deleted successfully');
//     } catch (error) {
//       toast.error(error instanceof Error ? error.message : 'Failed to delete destination. Please try again.');
//     } finally {
//       setDeleteDialogOpen(false);
//       setDestinationToDelete(null);
//     }
//   };

//   const handleBulkDelete = useCallback(() => {
//     if (selectedDestinations.length === 0) return;
//     setBulkDeleteDialogOpen(true);
//   }, [selectedDestinations]);

//   const confirmBulkDelete = async () => {
//     try {
//       await Promise.all(
//         selectedDestinations.map(destination => deleteDestination(destination.id))
//       );

//       // Remove deleted destinations from state
//       const selectedIds = selectedDestinations.map(d => d.id);
//       setDestinations(prev => prev.filter(d => !selectedIds.includes(d.id)));
//       setSelectedDestinations([]);
//       toast.success(`${selectedDestinations.length} destination(s) deleted successfully`);
//     } catch (error) {
//       toast.error('Failed to delete some destinations. Please try again.');
//       console.error('Bulk delete error:', error);
//     } finally {
//       setBulkDeleteDialogOpen(false);
//     }
//   }

//   const columns = useMemo<ColumnDef<Destination>[]>(() => [
//     {
//       accessorKey: "name",
//       header: createSortableHeader("Name"),
//       meta: { displayName: "Name" },
//       size: 300, // max-width
//       filterFn: "includesString",
//       cell: ({ row }) => {
//         const destination = row.original;
//         const imageUrl = (destination.image_urls && destination.image_urls.length > 0) ? destination.image_urls[0] : images.user;
//         const location = getLocationString(destination);

//         return (
//           <div className="flex items-center space-x-3 min-w-0">
//             <div className="relative h-10 w-10 rounded-full overflow-hidden shrink-0">
//               <img
//                 src={imageUrl}
//                 alt={destination.name}
//                 loading="lazy"
//                 className="h-full w-full object-cover"
//               />
//             </div>
//             <div className="min-w-0 flex-1">
//               <div className="font-medium truncate">{destination.name}</div>
//               <div className="text-sm text-muted-foreground truncate">{location}</div>
//             </div>
//           </div>
//         );
//       },
//     },
//     {
//       accessorKey: "short_description",
//       header: "Description",
//       meta: { displayName: "Description" },
//       size: 350,
//       cell: ({ row }) => {
//         const description = row.original.short_description || "No description";
//         return (
//           <div className="min-w-0">
//             <p className="text-sm line-clamp-2" title={description}>{description}</p>
//           </div>
//         );
//       },
//     },
//     {
//       accessorKey: "is_active",
//       header: createSortableHeader("Status"),
//       meta: { displayName: "Status" },
//       size: 120,
//       cell: ({ row }) => {
//         const status = getStatus(row.original);
//         return (
//           <Badge variant={getStatusColor(status)} className="capitalize">
//             {status}
//           </Badge>
//         );
//       },
//     },
//     {
//       accessorKey: "country",
//       header: createSortableHeader("Country"),
//       meta: { displayName: "Country" },
//       size: 150,
//       cell: ({ row }) => {
//         return <div className="text-sm">{row.original.country}</div>;
//       },
//     },
//     {
//       accessorKey: "price",
//       header: createSortableHeader("Price"),
//       meta: { displayName: "Price" },
//       size: 150,
//       cell: ({ row }) => {
//         return <div className="text-sm font-medium">{formatPrice(row.original.price)}</div>;
//       },
//     },
//     {
//       accessorKey: "rating",
//       header: createSortableHeader("Rating"),
//       meta: { displayName: "Rating" },
//       size: 100,
//       cell: ({ row }) => {
//         const rating = row.original.rating;
//         const reviewCount = row.original.review_count;
//         return (
//           <div className="text-sm">
//             {rating ? (
//               <div className="flex items-center space-x-1">
//                 <span>⭐</span>
//                 <span>{rating.toFixed(1)}</span>
//                 {reviewCount && <span className="text-muted-foreground">({reviewCount})</span>}
//               </div>
//             ) : (
//               <span className="text-muted-foreground">No rating</span>
//             )}
//           </div>
//         );
//       },
//     },
//     {
//       accessorKey: "created_at",
//       header: createSortableHeader("Created"),
//       meta: { displayName: "Created Date" },
//       size: 140,
//       sortFn: "datetime",
//       cell: ({ row }) => {
//         const date = row.original.created_at;
//         return <div className="text-sm whitespace-nowrap">{date ? new Date(date).toLocaleDateString() : 'N/A'}</div>;
//       },
//     },
//   ], []);

//   const actions = useMemo<DataTableAction<Destination>[]>(() => [
//     {
//       label: "View",
//       icon: Eye,
//       onClick: handleView,
//       variant: "ghost",
//     },
//     {
//       label: "Edit",
//       icon: Edit,
//       onClick: handleEdit,
//       variant: "ghost",
//     },
//     {
//       label: "Delete",
//       icon: Trash2,
//       onClick: handleDelete,
//       variant: "destructive",
//       show: (destination) => !destination.is_active,
//     },
//   ], [handleView, handleEdit, handleDelete]);

//   if (loading) {
//     return (
//       <div className="w-full min-w-0">
//         <div className="flex items-center justify-center h-32">
//           <div className="text-muted-foreground">Loading destinations...</div>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="w-full min-w-0">
//         <div className="flex items-center justify-center h-32">
//           <div className="text-destructive">Error: {error}</div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="w-full min-w-0">
//       <DataTable
//         columns={columns}
//         data={destinations}
//         searchKey="name"
//         searchPlaceholder="Search destinations..."
//         actions={actions}
//         onRowSelect={setSelectedDestinations}
//         columnVisibility={columnVisibility}
//         onColumnVisibilityChange={setColumnVisibility}
//         selectedItems={selectedDestinations}
//         onBulkDelete={handleBulkDelete}
//         onRefresh={handleRefresh}
//         isRefreshing={refreshing}
//         serverSidePagination={true}
//         currentPage={currentPage}
//         totalPages={totalPages}
//         totalItems={totalItems}
//         pageSize={pageSize}
//         onPreviousPage={handlePreviousPage}
//         onNextPage={handleNextPage}
//         cardFields={{
//           title: "name",
//           subtitle: "country",
//           description: "short_description",
//           badge: "is_active",
//           image: "image_urls",
//         }}
//       />

//       {/* Delete Confirmation Dialog */}
//       <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>Are you sure?</AlertDialogTitle>
//             <AlertDialogDescription>
//               This will permanently delete &quot;{destinationToDelete?.name}&quot;. This action cannot be undone.
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel>Cancel</AlertDialogCancel>
//             <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
//               Delete
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>

//       {/* Bulk Delete Confirmation Dialog */}
//       <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>Are you sure?</AlertDialogTitle>
//             <AlertDialogDescription>
//               This will permanently delete {selectedDestinations.length} destination(s). This action cannot be undone.
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel>Cancel</AlertDialogCancel>
//             <AlertDialogAction onClick={confirmBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
//               Delete All
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>
//     </div>
//   );
// }
