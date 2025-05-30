import { useState } from "react";
import { Button } from "admin-panel/components/ui/button";
import { Card, CardContent } from "admin-panel/components/ui/card";
import { Label } from "admin-panel/components/ui/label";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    // Your login logic here
    console.log("Logging in with", email, password);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md shadow-xl p-4">
        <CardContent className="space-y-4">
          <h1 className="text-2xl font-bold text-center">Login</h1>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <input
              id="email"
              placeholder="you@example.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <input
              id="password"
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button className="w-full" onClick={handleLogin}>
            Sign In
          </Button>

          <p className="text-sm text-center">
            Don’t have an account?{" "}
            <Link href="/signup" className="text-blue-600 hover:underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}