// LoginScreen.tsx — pieslēgšanās ekrāns ar Carbon komponentēm

import { Button } from "@carbon/react";
import { Login } from "@carbon/icons-react";

interface LoginScreenProps {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  return (
    <div className="login-screen">
      <div className="login-content">
        <h1>A11y Headings Checker</h1>
        <p>
          Pārbaudiet savu lapu virsrakstu struktūru atbilstību WCAG 2.4.6
          vadlīnijām.
        </p>
        <Button
          kind="primary"
          size="lg"
          renderIcon={Login}
          onClick={onLogin}
        >
          Pieslēgties ar Google
        </Button>
      </div>
    </div>
  );
}
