import { useState } from "react";
import type { FormEvent } from "react";
import type { AuthUser } from "../application/auth/auth-service";
import { authService } from "../application/auth/auth-service";

interface LoginPageProps {
  onAuthenticated: (
    user: AuthUser,
  ) => void;
}

export default function LoginPage({
  onAuthenticated,
}: LoginPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      if (isSignUp) {
        await authService.signUp(email, password);

        setMessage(
          "Account created. Check your email if confirmation is required.",
        );
      } else {
        const user =
            await authService.signIn(
                email,
                password,
            );

            onAuthenticated(user);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Authentication failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main>
      <h1>Work Hours Tracker</h1>

      <h2>{isSignUp ? "Create account" : "Sign in"}</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
            autoComplete={
              isSignUp ? "new-password" : "current-password"
            }
          />
        </div>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Please wait..."
            : isSignUp
              ? "Create account"
              : "Sign in"}
        </button>
      </form>

      {error && <p role="alert">{error}</p>}

      {message && <p role="status">{message}</p>}

      <button
        type="button"
        onClick={() => {
          setIsSignUp((current) => !current);
          setError(null);
          setMessage(null);
        }}
      >
        {isSignUp
          ? "Already have an account? Sign in"
          : "Create a new account"}
      </button>
    </main>
  );
}