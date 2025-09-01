import { SignedOut, SignInButton, SignUpButton, SignedIn, UserButton } from "@clerk/nextjs";
import { Button } from "./ui/button";
import { LogInIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

const UserButtonComponent = () => {
  return (
    <div className="absolute top-7 right-3.5 z-10 border-blue-500">
      <SignedOut>
          <Tooltip>
            <TooltipTrigger asChild>
            <SignInButton>
              <Button size="icon" variant="outline" className="cursor-pointer rounded-full -mt-1">
                <LogInIcon />
              </Button>
            </SignInButton>
            </TooltipTrigger>
            <TooltipContent>
              <p>Sign In</p>
            </TooltipContent>
          </Tooltip>
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </div>
  );
};

export default UserButtonComponent;
