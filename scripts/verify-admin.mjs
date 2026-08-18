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
 * PREREQUISITE: "Confirm email" must be OFF for this project
 * (Authentication -> Providers -> Email -> "Confirm email"). With it on,
 * signUp() returns no session, neither test user can sign in, and every
 * assertion below is unreachable. The script checks this for you at startup.
 *
 * CLEANUP: deleting an auth user requires the service_role key. Put it in
 * .env.local as SUPABASE_SERVICE_ROLE_KEY (NOT prefixed VITE_ -- anything
 * VITE_-prefixed is compiled into the public browser bundle) and this script
 * deletes both of its test users, and the contact message it submits, on the
 * way out -- including when it fails. Without that key it prints the SQL
 * instead and says plainly that nothing was cleaned up.
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
  stop this script before it created its first user. The domain below just has
  to be one the validator accepts; no mail is ever sent to it, because the
  prerequisite above requires confirmation mail to be switched off.

  Override with VERIFY_EMAIL_DOMAIN to point these at a domain you control. The
  local part stays namespaced either way:
    select * from auth.users where email like 'cgl-verify-%';
*/
const EMAIL_DOMAIN =
  process.env.VERIFY_EMAIL_DOMAIN || env.VERIFY_EMAIL_DOMAIN || "gmail.com";
const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const victimEmail = `cgl-verify-admin-victim-${stamp}@${EMAIL_DOMAIN}`;
const attackerEmail = `cgl-verify-admin-attacker-${stamp}@${EMAIL_DOMAIN}`;
const password = "admin-check-password";

/** Every assertion in this file, so an unreachable run can be scored honestly. */
const TOTAL_CHECKS = 13;

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
    `\n  Delete the test users by hand:\n` +
    `    delete from auth.users where email in (\n` +
    `      '${victimEmail}',\n` +
    `      '${attackerEmail}'\n` +
    `    );\n` +
    `    delete from public.contact_messages where email = '${attackerEmail}';\n`
  );
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

/**
 * Deletes both test users and the contact message this run submitted.
 * contact_messages has no FK to auth.users, so it does NOT cascade and has to
 * be removed explicitly.
 */
async function cleanup(userIds) {
  const ids = userIds.filter(Boolean);
  if (ids.length === 0 && !serviceRoleKey) return;

  if (!serviceRoleKey) {
    console.log(
      `\n  NOT CLEANED UP -- no SUPABASE_SERVICE_ROLE_KEY available.` +
        cleanupSql(),
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
      console.log(cleanupSql());
    } else {
      // profiles.id -> auth.users ON DELETE CASCADE takes the profile and every
      // vehicle / invoice / transaction with it.
      console.log(`\n  Cleaned up test user ${id} (cascade removed its rows).`);
    }
  }

  const { error: messageError } = await admin
    .from("contact_messages")
    .delete()
    .eq("email", attackerEmail);
  if (messageError) {
    console.log(
      `\n  Cleanup FAILED for the probe contact message: ${messageError.message}`,
    );
    console.log(
      `    delete from public.contact_messages where email = '${attackerEmail}';`,
    );
  } else {
    console.log(`  Cleaned up the probe contact message.`);
  }
}

async function main() {
  console.log(`\nAdmin-surface check against ${env.VITE_SUPABASE_URL}`);
  console.log(`Victim:   ${victimEmail}`);
  console.log(`Attacker: ${attackerEmail}\n`);

  const settings = await readAuthSettings();
  if (settings && settings.mailer_autoconfirm === false) {
    console.log(
      `  PREREQUISITE NOT MET: "Confirm email" is ON for this project.\n` +
        `  signUp() will return no session, so none of the checks below can\n` +
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
        `  the users it creates. Add it to .env.local to enable cleanup.\n`,
    );
  }

  // -------------------------------------------------------------------------
  // Set up a victim who owns a profile and a vehicle.
  // -------------------------------------------------------------------------
  const { data: victimSignUp, error: victimError } = await supabase.auth.signUp({
    email: victimEmail,
    password,
    options: { data: { full_name: "Admin Check Victim" } },
  });

  if (victimSignUp?.user?.id) createdUserIds.push(victimSignUp.user.id);

  if (victimError || !victimSignUp?.session) {
    /*
      Nothing below can run. Score every assertion as failed rather than
      exiting quietly -- a run that proved nothing must never look green.
    */
    failed += TOTAL_CHECKS;
    console.log(
      `  FAIL  all ${TOTAL_CHECKS} checks are UNREACHABLE -- could not establish\n` +
        `        the victim session: ${victimError?.message ?? "signUp returned no session (see the prerequisite above)"}\n`,
    );
    return;
  }

  const victimId = victimSignUp.user.id;

  const { data: victimVehicle } = await supabase
    .from("vehicles")
    .insert({ user_id: victimId, make: "Victim", model: "Sedan" })
    .select()
    .maybeSingle();

  await supabase.auth.signOut();

  // -------------------------------------------------------------------------
  // Everything below runs as the attacker: a plain, non-admin customer.
  // -------------------------------------------------------------------------
  const { data: attackerSignUp, error: attackerError } =
    await supabase.auth.signUp({
      email: attackerEmail,
      password,
      options: { data: { full_name: "Admin Check Attacker" } },
    });

  if (attackerSignUp?.user?.id) createdUserIds.push(attackerSignUp.user.id);

  if (attackerError || !attackerSignUp?.session) {
    failed += TOTAL_CHECKS;
    console.log(
      `  FAIL  all ${TOTAL_CHECKS} checks are UNREACHABLE -- could not establish\n` +
        `        the attacker session: ${attackerError?.message ?? "signUp returned no session (see the prerequisite above)"}\n`,
    );
    return;
  }

  const attackerId = attackerSignUp.user.id;

  // --- 1. adjust_balance is admin-only -------------------------------------
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

  // --- 2 & 3. admin read helpers are admin-only ----------------------------
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

  // --- 4 & 5. another customer's rows are invisible ------------------------
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

  // --- 6. contact_messages is admin-read-only ------------------------------
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

  // --- 7. vehicle status stays admin-only ----------------------------------
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
    } else {
      // The victim's vehicle is the fixture this assertion needs. Without it the
      // check did not run, and an unrun check is a failure, not a pass.
      check(
        "attacker cannot touch the victim's vehicle",
        false,
        "the victim's vehicle was never created, so the check could not run",
      );
    }
  }

  // --- 8. shipping_rates is read-only for customers ------------------------
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
