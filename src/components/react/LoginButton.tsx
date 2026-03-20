// LoginButton.tsx — Google pieteikšanās poga

import { useState } from "react";
import { Button, InlineLoading } from "@carbon/react";
import { Login } from "@carbon/icons-react";
import { initiateGoogleLogin } from "../../lib/auth";

interface LoginButtonProps {
  returnTo?: string;
}

export default function LoginButton({ returnTo }: LoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await initiateGoogleLogin(returnTo);
    } catch (error) {
      console.error("Login error:", error);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <InlineLoading
        status="active"
        iconDescription="Pāradresē uz Google..."
        description="Pāradresē uz Google..."
      />
    );
  }

  return (
    <Button
      kind="primary"
      size="lg"
      renderIcon={Login}
      onClick={handleLogin}
    >
      Pieslēgties ar Google
    </Button>
  );
}
