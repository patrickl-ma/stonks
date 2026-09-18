import { useState } from "react";
import type { FormEvent } from "react";
import { authClient } from "./lib/auth";
import {
  Anchor,
  Button,
  Center,
  Checkbox,
  Collapse,
  Container,
  Flex,
  Group,
  Paper,
  PasswordInput,
  Text,
  TextInput,
  Title,
  Transition,
} from "@mantine/core";

type Mode = "sign-in" | "sign-up";

function App() {
  const { data: session, isPending, refetch } = authClient.useSession();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result =
      mode === "sign-in"
        ? await authClient.signIn.email({ email, password })
        : await authClient.signUp.email({ name, email, password });

    setIsSubmitting(false);
    if (result.error) {
      setError(result.error.message ?? "Authentication failed");
      return;
    }

    await refetch();
    setPassword("");
  };

  const signOut = async () => {
    await authClient.signOut();
    await refetch();
  };

  if (isPending) {
    return (
      <main className="auth-shell">
        <p>Loading your session…</p>
      </main>
    );
  }

  if (session) {
    return (
      <main className="auth-shell">
        <section className="card">
          <p className="eyebrow">STONKS</p>
          <h1>Welcome back, {session.user.name}.</h1>
          <p className="muted">You are signed in as {session.user.email}.</p>
          <button type="button" onClick={() => void signOut()}>
            Sign out
          </button>
        </section>
      </main>
    );
  }

  return (
    <Center>
      <Flex p="md" direction="column" gap="md" align="center">
        <Title ta="center">
          {mode === "sign-in" ? "Sign in" : "Create your account"}
        </Title>
        <Anchor
          type="button"
          component="button"
          onClick={() => {
            setError(null);
            setMode(mode === "sign-in" ? "sign-up" : "sign-in");
          }}
        >
          {mode === "sign-in"
            ? "Need an account? Sign up"
            : "Already have an account? Sign in"}
        </Anchor>
        <Paper shadow="md" p="md" radius="md">
          <form onSubmit={(event) => void submit(event)}>
            <Flex p="md" direction="column" gap="md" align="stretch">
              <Collapse expanded={mode === "sign-up"}>
                <TextInput
                  label="Name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  autoComplete="name"
                />
              </Collapse>
              <TextInput
                label="Email"
                placeholder="your-email-address@domain.com"
                required
                radius="md"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
              />
              <PasswordInput
                type="password"
                radius="md"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
                autoComplete={
                  mode === "sign-in" ? "current-password" : "new-password"
                }
                label="Password"
                placeholder="Your password"
              />
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              <Group justify="space-between">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  fullWidth
                  radius="md"
                >
                  {isSubmitting
                    ? "Please wait…"
                    : mode === "sign-in"
                      ? "Sign in"
                      : "Sign up"}
                </Button>
                <Checkbox label="Remember me" />
                <Anchor component="button" size="sm">
                  Forgot password?
                </Anchor>
              </Group>
            </Flex>
          </form>
        </Paper>
      </Flex>
    </Center>
  );
}

export default App;
