"use client";
import { useState } from "react";
import SignInForm from "./sign-in-form";
import SignUpForm from "./sign-up-form";
import Dashboard from "./dashboard";
import { useAuth } from "@/src/hooks/use-auth";
import { Loader2 } from "lucide-react";

type AuthMode = "signin" | "signup";

interface AuthContainerProps {
  initialMode?: AuthMode;
}

export default function AuthContainer({
  initialMode = "signin",
}: AuthContainerProps) {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();
  console.log("user:", user, "isAuthenticated:", isAuthenticated);
  const [mode, setMode] = useState<AuthMode>(initialMode);

  const handleAuthSuccess = (userData: any, token: string) => {
    login(userData, token);
  };

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {isAuthenticated && user ? (
        <Dashboard username={user.username} onLogout={logout} />
      ) : (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md space-y-4">
            {mode === "signin" ? (
              <SignInForm
                onSuccess={handleAuthSuccess}
                onSwitchToSignUp={() => setMode("signup")}
              />
            ) : (
              <SignUpForm
                onSuccess={handleAuthSuccess}
                onSwitchToSignIn={() => setMode("signin")}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
