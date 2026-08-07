/**
 * Admin-surface acceptance check.
 *
 * Run this AFTER applying migrations 0009-0011 and filling in .env.local:
 *
 *   npm run verify:admin
 *
 * It proves the admin surface is closed to ordinary customers, using ONLY the
 * anon key and throwaway non-admin users -- exactly what a browser could do.
 *
 * NOTE: this creates TWO real auth users (a "victim" who owns data and an
 * "attacker" who tries to reach it). The script prints the SQL to delete them
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

const stamp = Date.now();
const victimEmail = `admin-check-victim-${stamp}@example.com`;
const attackerEmail = `admin-check-attacker-${stamp}@example.com`;
const password = "admin-check-password";

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

/** PostgREST reports a missing function as PGRST202. */
function isMissingFunction(error) {
  return error?.code === "PGRST202";
}

/**
 * A definer function that gates on is_admin() must RAISE for a non-admin.
 * A missing function is NOT a pass -- it means the migration has not been
 * applied and the check proved nothing.
 */
function checkRpcRefused(label, error, fnName) {
  if (isMissingFunction(error)) {
    failed += 1;
    console.log(
      `  FAIL  ${label} -- ${fnName}() does not exist. Apply the migration that creates it, then re-run.`,
    );
    return;
  }
  check(label, Boolean(error), "the call was ALLOWED");
}

function cleanupSql() {
  return (
    `\nClean up the test users with:\n` +
    `  delete from auth.users where email in (\n` +
    `    '${victimEmail}',\n` +
    `    '${attackerEmail}'\n` +
    `  );\n`
  );
}

console.log(`\nAdmin-surface check against ${env.VITE_SUPABASE_URL}`);
console.log(`Victim:   ${victimEmail}`);
console.log(`Attacker: ${attackerEmail}\n`);

// ---------------------------------------------------------------------------
// Set up a victim who owns a profile and a vehicle.
// ---------------------------------------------------------------------------
const { data: victimSignUp, error: victimError } = await supabase.auth.signUp({
  email: victimEmail,
  password,
  options: { data: { full_name: "Admin Check Victim" } },
});

if (victimError) {
  console.log(`  Could not create the victim user: ${victimError.message}`);
  process.exit(1);
}
if (!victimSignUp.session) {
  console.log(
    "\n  Signup returned no session -- email confirmation is enabled on this\n" +
      "  project. Disable it (Authentication -> Providers -> Email ->\n" +
      '  "Confirm email" off) to run these checks.\n',
  );
  process.exit(1);
}

const victimId = victimSignUp.user.id;

const { data: victimVehicle } = await supabase
  .from("vehicles")
  .insert({ user_id: victimId, make: "Victim", model: "Sedan" })
  .select()
  .maybeSingle();

await supabase.auth.signOut();

// ---------------------------------------------------------------------------
// Everything below runs as the attacker: a plain, non-admin customer.
// ---------------------------------------------------------------------------
const { data: attackerSignUp, error: attackerError } =
  await supabase.auth.signUp({
    email: attackerEmail,
    password,
    options: { data: { full_name: "Admin Check Attacker" } },
  });

if (attackerError || !attackerSignUp.session) {
  console.log(
    `  Could not create the attacker user: ${attackerError?.message ?? "no session"}`,
  );
  console.log(cleanupSql());
  process.exit(1);
}

const attackerId = attackerSignUp.user.id;

// --- 1. adjust_balance is admin-only ---------------------------------------
console.log("Admin RPCs are refused");
{
  const { error } = await supabase.rpc("adjust_balance", {
    target_user: attackerId,
    delta: 1000,
    note: "attempted self-credit",
  });
  checkRpcRefused(
    "non-admin calling adjust_balance is refused",
    error,
    "adjust_balance",
  );

  // Belt and braces: even if the call somehow returned, the balance must not
  // have moved. This is the check that matters if the exception is ever lost.
  const { data: profileAfter } = await supabase
    .from("profiles")
    .select("balance")
    .eq("id", attackerId)
    .maybeSingle();
  check(
    "attacker balance is still 0 after the attempt",
    Number(profileAfter?.balance ?? 0) === 0,
    `balance is now ${profileAfter?.balance}`,
  );
}

// --- 2 & 3. admin read helpers are admin-only ------------------------------
{
  const { error } = await supabase.rpc("admin_list_customers");
  checkRpcRefused(
    "non-admin calling admin_list_customers is refused",
    error,
    "admin_list_customers",
  );
}
{
  const { error } = await supabase.rpc("admin_overview_stats");
  checkRpcRefused(
    "non-admin calling admin_overview_stats is refused",
    error,
    "admin_overview_stats",
  );
}

// --- 4 & 5. another customer's rows are invisible --------------------------
console.log("\nOther customers' data is invisible");
{
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, balance")
    .eq("id", victimId);
  check(
    "attacker cannot read the victim's profile",
    Boolean(error) || (data?.length ?? 0) === 0,
    `returned ${data?.length} row(s)`,
  );
}
{
  const { data, error } = await supabase
    .from("vehicles")
    .select("id, make, model")
    .eq("user_id", victimId);
  check(
    "attacker cannot read the victim's vehicles",
    Boolean(error) || (data?.length ?? 0) === 0,
    `returned ${data?.length} row(s)`,
  );
}

// --- 6. contact_messages is admin-read-only --------------------------------
console.log("\ncontact_messages is write-only for customers");
{
  // Anyone may submit; the point is that nobody but an admin may read back.
  const { error: insertError } = await supabase
    .from("contact_messages")
    .insert({
      name: "Admin Check",
      email: attackerEmail,
      message: "Probe message from the admin verification script.",
    });
  check("attacker CAN submit a contact message", !insertError, insertError?.message);

  const { data, error } = await supabase
    .from("contact_messages")
    .select("id, name, message");
  check(
    "attacker cannot read any contact messages",
    Boolean(error) || (data?.length ?? 0) === 0,
    `returned ${data?.length} row(s)`,
  );
}

// --- 7. vehicle status stays admin-only ------------------------------------
console.log("\nVehicle status is still admin-only");
{
  const { data: own } = await supabase
    .from("vehicles")
    .insert({ user_id: attackerId, make: "Attacker", model: "Coupe" })
    .select()
    .maybeSingle();

  if (!own) {
    check("attacker could insert their own vehicle", false, "insert returned no row");
  } else {
    check(
      "attacker's own vehicle starts At Auction",
      own.status === "At Auction",
      `got ${own.status}`,
    );

    await supabase
      .from("vehicles")
      .update({ status: "Delivered" })
      .eq("id", own.id);

    // RLS blocks this SILENTLY: error === null and zero rows changed. The only
    // trustworthy signal is the row itself, read back afterwards. Asserting on
    // the presence of an error here would report a false failure.
    const { data: after } = await supabase
      .from("vehicles")
      .select("status")
      .eq("id", own.id)
      .maybeSingle();

    check(
      "attacker cannot change their own vehicle's status",
      after?.status === "At Auction",
      `status is now ${after?.status}`,
    );
  }

  // And they certainly cannot touch the victim's vehicle.
  if (victimVehicle) {
    await supabase
      .from("vehicles")
      .update({ status: "Delivered" })
      .eq("id", victimVehicle.id);
    // Read back as the victim later would; the attacker cannot see it at all,
    // so an empty result here is itself proof the update did not land.
    const { data: victimAfter } = await supabase
      .from("vehicles")
      .select("status")
      .eq("id", victimVehicle.id);
    check(
      "attacker cannot touch the victim's vehicle",
      (victimAfter?.length ?? 0) === 0,
      `returned ${victimAfter?.length} row(s)`,
    );
  }
}

// --- 8. shipping_rates is read-only for customers --------------------------
console.log("\nshipping_rates is read-only for customers");
{
  const { error } = await supabase.from("shipping_rates").insert({
    state_code: "ZZ",
    state_name: "Nowhere",
    branch: "Admin Check",
    rate: 1,
  });
  check(
    "attacker cannot insert a shipping rate",
    Boolean(error),
    "the insert was ALLOWED",
  );
}
{
  const { data: rows } = await supabase
    .from("shipping_rates")
    .select("id, rate")
    .limit(1);
  const target = rows?.[0];

  if (!target) {
    check(
      "attacker cannot update a shipping rate",
      false,
      "shipping_rates is empty, so the update could not be tested",
    );
  } else {
    const original = target.rate;
    await supabase
      .from("shipping_rates")
      .update({ rate: 999999 })
      .eq("id", target.id);

    // Same silent-block rule as vehicle status: read the row back.
    const { data: after } = await supabase
      .from("shipping_rates")
      .select("rate")
      .eq("id", target.id)
      .maybeSingle();

    check(
      "attacker cannot update a shipping rate",
      Number(after?.rate) === Number(original),
      `rate changed from ${original} to ${after?.rate}`,
    );
  }
}

await supabase.auth.signOut();

console.log(`\n${passed} passed, ${failed} failed`);
console.log(cleanupSql());

process.exit(failed > 0 ? 1 : 0);
