import { createAuthClient } from "better-auth/react";
import { stripeClient } from "@better-auth/stripe/client";

const stripeEnabled = process.env.NEXT_PUBLIC_STRIPE_ENABLED === 'true';

const plugins: any[] = [];

if (stripeEnabled) {
  plugins.push(
    stripeClient({
      subscription: true
    })
  );
}

export const authClient = createAuthClient({
  baseURL:
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000",
  plugins,
});

export type ClientSession = typeof authClient.$Infer.Session;
export type ClientUser = ClientSession["user"];

