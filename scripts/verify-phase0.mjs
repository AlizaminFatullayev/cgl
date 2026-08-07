/**
 * Phase 0 acceptance check.
 *
 * Run this AFTER applying all four migrations and filling in .env.local:
 *
 *   node scripts/verify-phase0.mjs
 *
 * It signs up a throwaway user against your real Supabase project and asserts
 * that the profile trigger fired and that the RLS rules actually hold. It only
 * ever uses the anon key, so it is exercising exactly what a browser could do.
 *
 * NOTE: this creates one real auth user. The script prints the SQL to delete it
 * at the end -- removing a user requires service_role, so it cannot clean up
 * after itself.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    try {
      const env = {};
      for (const line of readFileSync(file, "utf8").split("\n")) {
        const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
        if (match) env[match[1]] = match[2].trim();
      }
      if (env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY) return env;
    } catch {
      // try the next candidate
    }
  }
  throw new Error(
    "No .env.local / .env with both VITE_SUPABASE_* values found.",
  );
}

const env = loadEnv();
if (env.VITE_SUPABASE_URL.includes("placeholder")) {
  throw new Error(
    ".env.local still holds the placeholder values -- put your real Supabase project URL and anon key in it first.",
  );
}

const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const email = `phase0-check-${Date.now()}@example.com`;
const password = "phase0-check-password";
const fullName = "Phase Zero Check";

let passed = 0;
let failed = 0;

function check(label, ok, detail = "") {
  if (ok) {
    passed += 1;
    console.log(`  PASS  ${label}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${label}${detail ? ` -- ${detail}` : ""}`);
  }
}

console.log(`\nPhase 0 check against ${env.VITE_SUPABASE_URL}`);
console.log(`Test user: ${email}\n`);

// --- shipping_rates is readable while signed out -----------------------------
console.log("Anonymous access");
{
  const { error } = await supabase.from("shipping_rates").select("id").limit(1);
  check("anon can SELECT shipping_rates", !error, error?.message);
}
{
  // Either a permission error or an empty result is a pass -- both mean the
  // signed-out caller learned nothing. A non-empty result is a leak.
  const { data, error } = await supabase.from("profiles").select("id").limit(1);
  check(
    "anon reads no profiles",
    Boolean(error) || (data?.length ?? 0) === 0,
    `returned ${data?.length} row(s)`,
  );
}
{
  const { data, error } = await supabase.from("vehicles").select("id").limit(1);
  check(
    "anon reads no vehicles",
    Boolean(error) || (data?.length ?? 0) === 0,
    `returned ${data?.length} row(s)`,
  );
}

// --- signup creates a profile ------------------------------------------------
console.log("\nSignup -> profile");
const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
  email,
  password,
  options: { data: { full_name: fullName } },
});
check("signUp succeeded", !signUpError, signUpError?.message);

if (!signUpData?.session) {
  console.log(
    "\n  Signup returned no session -- email confirmation is enabled on this\n" +
      "  project. Disable it (Authentication -> Providers -> Email ->\n" +
      '  "Confirm email" off) to run the rest of these checks.\n',
  );
  process.exit(failed > 0 ? 1 : 0);
}

const userId = signUpData.user.id;

// --- sign out, then sign back in --------------------------------------------
await supabase.auth.signOut();
const { error: signInError } = await supabase.auth.signInWithPassword({
  email,
  password,
});
check(
  "signIn with the same credentials works",
  !signInError,
  signInError?.message,
);

const { data: profile, error: profileError } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", userId)
  .maybeSingle();

check("profile row was auto-created", Boolean(profile), profileError?.message);
check(
  "profile.role defaults to 'user'",
  profile?.role === "user",
  `got ${profile?.role}`,
);
check(
  "profile.full_name came from signup metadata",
  profile?.full_name === fullName,
  `got ${profile?.full_name}`,
);
check(
  "profile.balance defaults to 0",
  Number(profile?.balance) === 0,
  `got ${profile?.balance}`,
);

// --- privilege escalation must fail -----------------------------------------
console.log("\nRLS: escalation is blocked");
{
  const { error } = await supabase
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", userId);
  check(
    "user cannot promote themselves to admin",
    Boolean(error),
    "the update was ALLOWED",
  );
}
{
  const { error } = await supabase
    .from("profiles")
    .update({ balance: 999999 })
    .eq("id", userId);
  check(
    "user cannot credit their own balance",
    Boolean(error),
    "the update was ALLOWED",
  );
}
{
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: "Renamed By Owner" })
    .eq("id", userId);
  check("user CAN still edit their own full_name", !error, error?.message);
}

// --- vehicles: status is not writable by a non-admin -------------------------
console.log("\nRLS: vehicles");
{
  const { error } = await supabase
    .from("vehicles")
    .insert({
      user_id: userId,
      make: "Toyota",
      model: "Camry",
      status: "Delivered",
    });
  check(
    "user cannot insert a vehicle at status Delivered",
    Boolean(error),
    "the insert was ALLOWED",
  );
}
let vehicleId = null;
{
  const { data, error } = await supabase
    .from("vehicles")
    .insert({ user_id: userId, make: "Toyota", model: "Camry" })
    .select()
    .maybeSingle();
  check(
    "user CAN insert their own vehicle at the default status",
    !error,
    error?.message,
  );
  check(
    "that vehicle starts At Auction",
    data?.status === "At Auction",
    `got ${data?.status}`,
  );
  vehicleId = data?.id ?? null;
}
if (vehicleId) {
  await supabase
    .from("vehicles")
    .update({ status: "Delivered" })
    .eq("id", vehicleId);
  // RLS may block the write silently (no error, zero rows changed) OR the
  // trigger may raise. Either way, the real proof is: did status actually move?
  const { data: after } = await supabase
    .from("vehicles")
    .select("status")
    .eq("id", vehicleId)
    .maybeSingle();
  check(
    "user cannot update the status of their own vehicle",
    after?.status === "At Auction",
    `status is now ${after?.status}`,
  );
}
{
  const { error } = await supabase
    .from("vehicles")
    .insert({ user_id: "00000000-0000-0000-0000-000000000000", make: "Ghost" });
  check(
    "user cannot file a vehicle under someone else's id",
    Boolean(error),
    "the insert was ALLOWED",
  );
}

// --- money tables are admin-only for writes ----------------------------------
console.log("\nRLS: invoices / transactions");
{
  const { error } = await supabase
    .from("transactions")
    .insert({ user_id: userId, amount: 5000, type: "topup" });
  check(
    "user cannot create their own transaction",
    Boolean(error),
    "the insert was ALLOWED",
  );
}
{
  const { error } = await supabase
    .from("invoices")
    .insert({ user_id: userId, amount: 0, status: "paid" });
  check(
    "user cannot create their own invoice",
    Boolean(error),
    "the insert was ALLOWED",
  );
}
{
  const { error } = await supabase
    .from("shipping_rates")
    .insert({
      state_code: "ZZ",
      state_name: "Nowhere",
      branch: "None",
      rate: 1,
    });
  check(
    "user cannot add a shipping rate",
    Boolean(error),
    "the insert was ALLOWED",
  );
}

await supabase.auth.signOut();

console.log(`\n${passed} passed, ${failed} failed`);
console.log(
  `\nClean up the test user with:\n` +
    `  delete from auth.users where email = '${email}';\n`,
);

process.exit(failed > 0 ? 1 : 0);
