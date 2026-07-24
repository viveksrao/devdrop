import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

function getInitials(name?: string | null, email?: string | null) {
  if (name) {
    return name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  if (email) return email[0]?.toUpperCase() ?? "?";
  return "?";
}

interface UserAvatarProps {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function UserAvatar({ name, email, image, size = "default", className }: UserAvatarProps) {
  const initials = getInitials(name, email);

  return (
    <Avatar size={size} className={cn(className)}>
      {image && <AvatarImage src={image} alt={name ?? email ?? "User"} />}
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
}
