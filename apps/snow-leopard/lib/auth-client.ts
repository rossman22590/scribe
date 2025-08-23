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
  plugins,
});

export type ClientSession = typeof authClient.$Infer.Session;
export type ClientUser = ClientSession["user"];

