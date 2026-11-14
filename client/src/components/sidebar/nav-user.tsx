import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { appIcons } from "@/configs/icons"
import { images } from "@/assets";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export function NavUser() {
  const { session, signOut } = useAuth();
  if (!session) return null;

  const user = {
    name: session.user.name,
    email: session.user.email,
    avatar: session.user.avatarUrl ?? "",
  };

  const handleSignOut = () => {
    signOut().catch(() => toast.error("Couldn't reach the server, but you've been signed out here."));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="w-9 h-9 cursor-pointer">
          <AvatarImage
            src={user.avatar?.trim() || images.user}
            alt={user.name}
            onError={(e) => {
              const img = e.currentTarget;

              if (!img.src.endsWith(images.user)) {
                img.src = images.user;
              }
            }}
          />
          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-56"
        side={"bottom"}
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm cursor-default">
            <Avatar className="w-9 h-9">
              <AvatarImage
                src={user.avatar?.trim() || images.user}
                alt={user.name}
                onError={(e) => {
                  const img = e.currentTarget;

                  if (!img.src.endsWith(images.user)) {
                    img.src = images.user;
                  }
                }}
              />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs">{user.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <appIcons.badgeCheck />
            Account
          </DropdownMenuItem>
          <DropdownMenuItem>
            <appIcons.user />
            Profile
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={handleSignOut}>
          <appIcons.logOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
