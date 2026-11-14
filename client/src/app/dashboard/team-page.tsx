import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BranchesTab } from "@/components/team/branches-tab";
import { InviteDialog } from "@/components/team/invite-dialog";
import { InvitesTab } from "@/components/team/invites-tab";
import { MembersTab } from "@/components/team/members-tab";
import { TeamsTab } from "@/components/team/teams-tab";
import { useBranches, useTeams } from "@/components/team/use-identity";
import { useAuth } from "@/hooks/use-auth";

export default function TeamPage() {
    const { can } = useAuth();
    const branches = useBranches();
    const teams = useTeams();
    const [inviting, setInviting] = useState(false);

    const branchList = branches.data ?? [];
    const teamList = teams.data ?? [];
    // Branches only matter once there's more than one, or to people who create them.
    const showBranches = branchList.length > 1 || can("branches:manage");

    return (
        <div className="w-full min-w-0 space-y-5">
            <div>
                <h1 className="text-2xl font-semibold">Team</h1>
                <p className="text-sm text-muted-foreground">People in your organization, their roles, teams and branches.</p>
            </div>

            <Tabs defaultValue="members">
                <TabsList>
                    <TabsTrigger value="members">Members</TabsTrigger>
                    {can("members:invite") && <TabsTrigger value="invites">Invitations</TabsTrigger>}
                    <TabsTrigger value="teams">Teams</TabsTrigger>
                    {showBranches && <TabsTrigger value="branches">Branches</TabsTrigger>}
                </TabsList>

                <TabsContent value="members" className="pt-3">
                    <MembersTab branches={branchList} teams={teamList} />
                </TabsContent>
                {can("members:invite") && (
                    <TabsContent value="invites" className="pt-3">
                        <InvitesTab branches={branchList} onInvite={() => setInviting(true)} />
                    </TabsContent>
                )}
                <TabsContent value="teams" className="pt-3">
                    <TeamsTab teams={teamList} branches={branchList} loading={teams.isLoading || branches.isLoading} />
                </TabsContent>
                {showBranches && (
                    <TabsContent value="branches" className="pt-3">
                        <BranchesTab branches={branchList} loading={branches.isLoading} />
                    </TabsContent>
                )}
            </Tabs>

            {inviting && <InviteDialog open={inviting} onOpenChange={setInviting} branches={branchList} teams={teamList} />}
        </div>
    );
}
