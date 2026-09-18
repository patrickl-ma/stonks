import { useState } from "react";
import type { FormEvent } from "react";
import "./App.css";
import { authClient } from "./lib/auth";
import {
  Anchor,
  Button,
  Center,
  Checkbox,
  Container,
  Group,
  Paper,
  PasswordInput,
  Text,
  TextInput,
  Title,
} from "@mantine/core";

type Mode = "sign-in" | "sign-up";

export function AuthenticationImage() {
  return (
    <div>
      <Paper>
        <Title order={2}>Welcome back toStonks!</Title>
        <TextInput
          label="Email address"
          placeholder="hello@gmail.com"
          size="md"
          radius="md"
        />
        <PasswordInput
          label="Password"
          placeholder="Your password"
          mt="md"
          size="md"
          radius="md"
        />
        <Checkbox label="Keep me logged in" mt="xl" size="md" />
        <Button fullWidth mt="xl" size="md" radius="md">
          Login
        </Button>

        <Text ta="center" mt="md">
          Don&apos;t have an account?{" "}
          <Anchor href="#" fw={500} onClick={(event) => event.preventDefault()}>
            Register
          </Anchor>
        </Text>
      </Paper>
    </div>
  );
}

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
      <Container size={420} my={40}>
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
        <Paper withBorder shadow="sm" p={22} mt={30} radius="md">
          <form onSubmit={(event) => void submit(event)}>
            {mode === "sign-up" && (
              <TextInput
                label="Name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                autoComplete="name"
              />
            )}
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
              mt="md"
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
            <Group justify="space-between" mt="lg">
              <Button
                type="submit"
                disabled={isSubmitting}
                fullWidth
                mt="xl"
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
          </form>
        </Paper>
      </Container>
    </Center>
  );
}

export default App;
