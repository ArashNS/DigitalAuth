"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import {
  signUp,
  type SignUpData,
  type ErrorResponse,
} from "@/src/lib/auth-api";

interface SignUpFormProps {
  onSuccess?: (userData: any, token: string) => void;
  onSwitchToSignIn?: () => void;
}

export default function SignUpForm({
  onSuccess,
  onSwitchToSignIn,
}: SignUpFormProps) {
  const [formData, setFormData] = useState<SignUpData>({
    username: "",
    email: "",
    password: "",
    password_confirm: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<ErrorResponse>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear specific field error when user starts typing
    if (errors[name as keyof ErrorResponse]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<ErrorResponse> = {};

    if (formData.username.length < 3) {
      newErrors.username = ["Username must be at least 3 characters long"];
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = ["Please enter a valid email address"];
    }

    if (formData.password.length < 8) {
      newErrors.password = ["Password must be at least 8 characters long"];
    }

    if (formData.password !== formData.password_confirm) {
      newErrors.password_confirm = ["Passwords do not match"];
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    // Client-side validation
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsLoading(false);
      return;
    }

    try {
      const response = await signUp(formData);
      onSuccess?.(response.user, response.access);
      alert("Registration successful!"); // فقط اگر موفق شد
    } catch (err) {
      if (err && typeof err === "object") {
        const errorObj = err as ErrorResponse;
        if (errorObj.username && errorObj.username.length > 0) {
          setErrors({ username: errorObj.username });
          return;
        }
        if (errorObj.email && errorObj.email.length > 0) {
          setErrors({ email: errorObj.email });
          return;
        }
        if (errorObj.password_confirm && errorObj.password_confirm.length > 0) {
          setErrors({ password_confirm: errorObj.password_confirm });
          return;
        }
        if (errorObj.detail) {
          setErrors({ detail: errorObj.detail });
          return;
        }
      }
      setErrors({ detail: "An error occurred during registration" });
    } finally {
      setIsLoading(false);
    }
  };

  const getFieldError = (field: keyof ErrorResponse) => {
    const error = errors[field];
    return Array.isArray(error) ? error[0] : error;
  };

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Sign Up</CardTitle>
        <CardDescription>Create a new account to get started</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.detail && (
            <Alert variant="destructive">
              <AlertDescription>{errors.detail}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="Choose a username"
              value={formData.username}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
            {getFieldError("username") && (
              <p className="text-sm text-red-600">
                {getFieldError("username")}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="m@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
            {getFieldError("email") && (
              <p className="text-sm text-red-600">{getFieldError("email")}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="At least 8 characters"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
            {getFieldError("password") && (
              <p className="text-sm text-red-600">
                {getFieldError("password")}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password_confirm">Confirm Password</Label>
            <Input
              id="password_confirm"
              name="password_confirm"
              type="password"
              placeholder="Confirm your password"
              value={formData.password_confirm}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
            {getFieldError("password_confirm") && (
              <p className="text-sm text-red-600">
                {getFieldError("password_confirm")}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Sign Up"
            )}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToSignIn}
            className="underline hover:text-primary"
            disabled={isLoading}
          >
            Sign in
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
