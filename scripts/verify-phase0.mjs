/**
 * Phase 0 acceptance check.
 *
 * Run this AFTER applying all four migrations and filling in .env.local:
 *
 *   node scripts/verify-phase0.mjs
 *
 * It signs up a throwaway user against your real Supabase project and asserts
 * that the profile trigger fired and that the RLS rules actually hold. It only
 * ever uses the anon key for the checks themselves, so it is exercising exactly
 * what a browser could do.
 *
 * PREREQUISITE: "Confirm email" must be OFF for this project
 * (Authentication -> Providers -> Email -> "Confirm email"). With it on,
 * signUp() returns no session, the script cannot sign in as the user it just
 * created, and every RLS assertion below is unreachable. The script checks this
 * for you at startup and refuses to report success it has not earned.
 *
 * CLEANUP: deleting an auth user requires the service_role key. Put it in
 * .env.local as SUPABASE_SERVICE_ROLE_KEY (NOT prefixed VITE_ -- anything
 * VITE_-prefixed is compiled into the public browser bundle) and this script
 * deletes its own test user on the way out, including when it fails. Without
 * that key the script prints the SQL instead and says plainly that nothing was
 * cleaned up.
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

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

/*
  Supabase's address validator rejects IANA-reserved test domains --
  "@example.com" comes back as `email_address_invalid`, which is what used to
  stop this script before it reached a single RLS assertion. The domain below
  just has to be one the validator accepts; no mail is ever sent to it, because
  the prerequisite above requires confirmation mail to be switched off.

  Override with VERIFY_EMAIL_DOMAIN if you would rather point these at a domain
  you control. The local part stays namespaced either way, so leftovers are
  easy to find:  select * from auth.users where email like 'cgl-verify-%';
*/
const EMAIL_DOMAIN =
  process.env.VERIFY_EMAIL_DOMAIN || env.VERIFY_EMAIL_DOMAIN || "gmail.com";
const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const email = `cgl-verify-phase0-${stamp}@${EMAIL_DOMAIN}`;
const password = "phase0-check-password";
const fullName = "Phase Zero Check";

let passed = 0;
let failed = 0;

/*
  Module scope on purpose: the cleanup in the `finally` below has to see users
  created before a crash, which it could not do if this were a return value.
*/
const createdUserIds = [];

function check(label, ok, detail = "") {
  if (ok) {
    passed += 1;
    console.log(`  PASS  ${label}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${label}${detail ? ` -- ${detail}` : ""}`);
  }
}

/**
 * Reads the project's public auth settings. `mailer_autoconfirm: false` means
 * "Confirm email" is ON, which makes every check below unreachable.
 */
async function readAuthSettings() {
  try {
    const response = await fetch(`${env.VITE_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: env.VITE_SUPABASE_ANON_KEY },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/** Deletes the users this run created. Requires the service_role key. */
async function cleanup(userIds) {
  const ids = userIds.filter(Boolean);
  if (ids.length === 0) return;

  if (!serviceRoleKey) {
    console.log(
      `\n  NOT CLEANED UP -- no SUPABASE_SERVICE_ROLE_KEY available.\n` +
        `  Delete the test user by hand, or these accumulate on every run:\n` +
        `    delete from auth.users where email = '${email}';\n`,
    );
    return;
  }

  const admin = createClient(env.VITE_SUPABASE_URL, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  for (const id of ids) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) {
      console.log(`\n  Cleanup FAILED for user ${id}: ${error.message}`);
      console.log(`    delete from auth.users where email = '${email}';`);
    } else {
      // profiles.id -> auth.users ON DELETE CASCADE, so the profile and every
      // vehicle / invoice / transaction hanging off it go with the user.
      console.log(`\n  Cleaned up test user ${id} (cascade removed its rows).`);
    }
  }
}

async function main() {
  console.log(`\nPhase 0 check against ${env.VITE_SUPABASE_URL}`);
  console.log(`Test user: ${email}\n`);

  const settings = await readAuthSettings();
  if (settings && settings.mailer_autoconfirm === false) {
    console.log(
      `  PREREQUISITE NOT MET: "Confirm email" is ON for this project.\n` +
        `  signUp() will return no session, so none of the RLS checks below can\n` +
        `  run. Turn it off at Authentication -> Providers -> Email ->\n` +
        `  "Confirm email", then re-run.\n`,
    );
  } else if (settings === null) {
    console.log(
      `  Note: could not read /auth/v1/settings, so the "Confirm email"\n` +
        `  prerequisite could not be verified up front.\n`,
    );
  }
  if (!serviceRoleKey) {
    console.log(
      `  Note: SUPABASE_SERVICE_ROLE_KEY is not set, so this run cannot delete\n` +
        `  the user it creates. Add it to .env.local to enable cleanup.\n`,
    );
  }

  // --- shipping_rates is readable while signed out ---------------------------
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

  // --- signup creates a profile ----------------------------------------------
  console.log("\nSignup -> profile");
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  check("signUp succeeded", !signUpError, signUpError?.message);
  if (signUpData?.user?.id) createdUserIds.push(signUpData.user.id);

  if (!signUpData?.session) {
    /*
      Everything past this point is unreachable. That is a FAILURE of the run,
      not a neutral outcome: exiting 0 here would report "no failures" for a
      run that proved almost nothing. Count the unreached checks as failed.
    */
    const unreached = 16;
    failed += unreached;
    console.log(
      `\n  FAIL  ${unreached} remaining checks are UNREACHABLE -- signUp returned\n` +
        `        no session. Either "Confirm email" is on (see above) or the\n` +
        `        signup itself was rejected: ${signUpError?.message ?? "no error reported"}\n`,
    );
    return;
  }

  const userId = signUpData.user.id;

  // --- sign out, then sign back in ------------------------------------------
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

  // --- privilege escalation must fail ---------------------------------------
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

  // --- vehicles: status is not writable by a non-admin -----------------------
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

  // --- money tables are admin-only for writes --------------------------------
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
}

let crashed = null;
try {
  await main();
} catch (error) {
  crashed = error;
} finally {
  // Runs on the happy path, on an early return and on a crash, so repeated
  // runs neither accumulate accounts nor burn the project's email quota.
  await cleanup(createdUserIds);
}

if (crashed) {
  console.error(`\nRun crashed: ${crashed.message}`);
  process.exit(1);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
