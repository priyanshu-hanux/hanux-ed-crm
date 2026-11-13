import type * as React from "react"

// The desktop table's structure: a header strip and a body as two tables that share column widths

export function TableFrame({
    wrapperRef,
    headScrollRef,
    bodyScrollRef,
    scrollbarRef,
    scrollbarInnerRef,
    onScroll,
    visibleColumns,
    totalWidth,
    cellBorders,
    isResizing,
    isBusy,
    showProgress,
    stickyHeader,
    headerTop,
    maxBodyHeight,
    header,
    body,
}: {
    wrapperRef: React.Ref<HTMLDivElement>
    headScrollRef: React.Ref<HTMLDivElement>
    bodyScrollRef: React.Ref<HTMLDivElement>
    scrollbarRef: React.Ref<HTMLDivElement>
    scrollbarInnerRef: React.Ref<HTMLDivElement>
    onScroll: (event: React.UIEvent<HTMLElement>) => void
    // Visible columns, in order (for the shared <colgroup>) 
    visibleColumns: { id: string; getSize: () => number }[]
    // Sum of the column widths 
    totalWidth: number
    cellBorders: boolean
    isResizing: boolean
    // Loading or refreshing (aria-busy) 
    isBusy: boolean
    // Thin animated bar across the top while refreshing 
    showProgress: boolean
    stickyHeader: boolean
    // Where the header sticks, in px from the top of the scroll container 
    headerTop: number
    maxBodyHeight?: number | string
    // <thead> 
    header: React.ReactNode
    // <tbody> 
    body: React.ReactNode
}) {
    // Both tables share these widths, so the header and body columns line up exactly
    const tableStyle: React.CSSProperties = { width: totalWidth, minWidth: "100%" }
    // The header strip is wider than the body's visible area by the gutter, so the
    // header table fills the strip minus that gutter, matching the body table exactly
    const headTableStyle: React.CSSProperties = {
        width: totalWidth,
        minWidth: "calc(100% - var(--dt-gutter, 0px))",
    }

    const colGroup = (
        <colgroup>
            {visibleColumns.map((column) => (
                <col key={column.id} style={{ width: column.getSize() }} />
            ))}
        </colgroup>
    )

    return (
        <div className="hidden md:block mb-2 w-full min-w-0">
            <div
                ref={wrapperRef}
                data-grid={cellBorders || undefined}
                data-resizing={isResizing || undefined}
                aria-busy={isBusy || undefined}
                className="data-table relative isolate"
                style={stickyHeader ? ({ "--dt-sticky-top": `${headerTop}px` } as React.CSSProperties) : undefined}
            >
                {showProgress && <div className="data-table-progress" aria-hidden="true" />}

                <div
                    ref={headScrollRef}
                    onScroll={onScroll}
                    className={`data-table-head relative flex overflow-x-auto rounded-t-md border-x border-t ${stickyHeader ? "sticky z-5" : ""}`}
                    style={stickyHeader ? { top: headerTop } : undefined}
                >
                    <table className="shrink-0 table-fixed border-separate border-spacing-0 caption-bottom text-sm" style={headTableStyle}>
                        {colGroup}
                        {header}
                    </table>
                    <div aria-hidden="true" className="data-table-gutter" />
                </div>

                <div
                    ref={bodyScrollRef}
                    onScroll={onScroll}
                    className="data-table-body relative overflow-x-hidden overflow-y-auto border-x"
                    style={maxBodyHeight != null ? { maxHeight: maxBodyHeight } : undefined}
                >
                    <table className="table-fixed border-separate border-spacing-0 caption-bottom text-sm" style={tableStyle}>
                        {colGroup}
                        {body}
                    </table>
                </div>

                <div
                    ref={scrollbarRef}
                    onScroll={onScroll}
                    className="data-table-scrollbar overflow-x-auto overflow-y-hidden rounded-b-md border-x border-b"
                >
                    <div ref={scrollbarInnerRef} style={{ height: 1 }} />
                </div>
            </div>
        </div>
    )
}
