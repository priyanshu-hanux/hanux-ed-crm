// import { DestinationsTable } from "@/components/leads/destinations-table"
import { CandidatesTableDemo } from "@/components/leads/destinations-table.demo"

// const USE_DEMO_DATA = true


const DestinationPage = () => {
  return (
    <div className="w-full min-w-0 space-y-6">
      {/* Enhanced Page Header */}

      {/* {USE_DEMO_DATA ? <CandidatesTableDemo /> : <DestinationsTable />} */}
      <CandidatesTableDemo />
    </div>
  )
}


export default DestinationPage
