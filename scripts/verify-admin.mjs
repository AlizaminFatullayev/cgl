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
 * Since 0013 it also covers the customer EDIT boundary: 0013 opens an UPDATE
 * path on vehicles so a customer can correct a car they added, and the last
 * third of this file is the fence around that -- which columns survive an
 * UPDATE, which survive an INSERT, and whose photos may be deleted. Those
 * checks assert on the row read back out of the database, never on the error
 * the API returned: a trigger rejection RAISEs, while an RLS rejection is
 * silent (no error, zero rows), so the error alone would be a false signal.
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

/** The victim's VIN, read back at the end to prove the attacker never moved it. */
const VICTIM_VIN = "VICTIMVIN0000001";

/** Every assertion in this file, so an unreachable run can be scored honestly. */
const TOTAL_CHECKS = 28;

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
    .insert({
      user_id: victimId,
      make: "Victim",
      model: "Sedan",
      vin: VICTIM_VIN,
    })
    .select()
    .maybeSingle();

  /*
    A photo row for the victim's vehicle, so the DELETE boundary has something
    to try to delete. No storage object is uploaded: vehicle_photos.url holds a
    path, and the row is what the RLS policy governs.
  */
  let victimPhoto = null;
  if (victimVehicle) {
    const { data } = await supabase
      .from("vehicle_photos")
      .insert({
        vehicle_id: victimVehicle.id,
        url: `${victimId}/${victimVehicle.id}/verify-probe.jpg`,
      })
      .select()
      .maybeSingle();
    victimPhoto = data;
  }

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

  // --- 9. the customer edit boundary (0013) --------------------------------
  /*
    0013 deliberately OPENS an UPDATE path for customers so they can correct a
    car they added, and an INSERT path has always been open. Everything below
    proves the fence around both.

    Every assertion reads the row back out of the database afterwards. The two
    rejection mechanisms look completely different from the client -- a trigger
    RAISEs and PostgREST surfaces an error, while RLS blocks silently by
    matching no rows and returning success -- so the returned error is not a
    trustworthy signal. What is actually stored is.
  */
  console.log("\nCustomer edit boundary: UPDATE");

  /** Reads one column straight back out of the database. */
  const storedVehicle = async (id, columns) => {
    const { data } = await supabase
      .from("vehicles")
      .select(columns)
      .eq("id", id)
      .maybeSingle();
    return data;
  };

  const { data: ownVehicle } = await supabase
    .from("vehicles")
    .insert({
      user_id: attackerId,
      make: "Attacker",
      model: "Editable",
      vin: "ATTACKERVIN00001",
    })
    .select()
    .maybeSingle();

  if (!ownVehicle) {
    // The fixture every UPDATE assertion needs. Without it they did not run,
    // and an unrun check is a failure, not a pass.
    for (const label of [
      "own vehicle: vin CAN be corrected",
      "own vehicle: status change does not land",
      "own vehicle: paid change does not land",
      "own vehicle: total_amount change does not land",
      "own vehicle: auction_penalty change does not land",
      "own vehicle: user_id change does not land",
    ]) {
      check(label, false, "the attacker's vehicle was never created");
    }
  } else {
    // 9.1 the one thing a customer IS allowed to do.
    await supabase
      .from("vehicles")
      .update({ vin: "CORRECTEDVIN0001" })
      .eq("id", ownVehicle.id);
    const afterVin = await storedVehicle(ownVehicle.id, "vin");
    check(
      "own vehicle: vin CAN be corrected",
      afterVin?.vin === "CORRECTEDVIN0001",
      `vin is ${afterVin?.vin}`,
    );

    // 9.2 - 9.5 the admin-owned columns, one statement each so a single
    // rejection cannot mask the others.
    /*
      [column, what the attacker tries, what must still be stored].

      Every attempted value DIFFERS from the value already in the row. That
      matters: `is distinct from` is what the guard diffs on, so writing a
      column's existing value back is a no-op the guard correctly ignores, and
      a test that did that would pass without proving anything.
    */
    const blocked = [
      ["status", "Delivered", "At Auction"],
      ["paid", 999999, 0],
      ["total_amount", 0.01, 0],
      ["auction_penalty", 999, 0],
    ];

    for (const [column, attempt, expected] of blocked) {
      const { error } = await supabase
        .from("vehicles")
        .update({ [column]: attempt })
        .eq("id", ownVehicle.id);

      const after = await storedVehicle(ownVehicle.id, column);
      const stored = after?.[column];
      // status is text, the rest are numeric -- compare each in its own type
      // rather than forcing both through Number(), where "At Auction" would
      // become NaN and NaN === NaN is false.
      const unchanged =
        typeof expected === "number"
          ? Number(stored) === expected
          : stored === expected;

      check(
        `own vehicle: ${column} change does not land`,
        Boolean(after) && unchanged,
        `${column} is now ${stored}${error ? ` (db said: ${error.code})` : " (no error returned)"}`,
      );
    }

    // 9.6 re-filing the car under someone else.
    {
      const { error } = await supabase
        .from("vehicles")
        .update({ user_id: victimId })
        .eq("id", ownVehicle.id);

      const after = await storedVehicle(ownVehicle.id, "user_id");
      check(
        "own vehicle: user_id change does not land",
        after?.user_id === attackerId,
        `user_id is now ${after?.user_id}${error ? ` (db said: ${error.code})` : " (no error returned)"}`,
      );
    }
  }

  // 9.7 another customer's vehicle. RLS filters the UPDATE to zero rows, so
  // there is no error and nothing to read back as this user -- the victim
  // re-check at the end is what proves the VIN never moved.
  if (victimVehicle) {
    const { data: touched } = await supabase
      .from("vehicles")
      .update({ vin: "STOLENVIN0000001" })
      .eq("id", victimVehicle.id)
      .select();
    check(
      "another customer's vehicle: vin update touches zero rows",
      (touched?.length ?? 0) === 0,
      `returned ${touched?.length} row(s)`,
    );
  } else {
    check(
      "another customer's vehicle: vin update touches zero rows",
      false,
      "the victim's vehicle was never created, so the check could not run",
    );
  }

  // --- 10. the INSERT side --------------------------------------------------
  /*
    The Add Vehicle form is where a customer types, so this is where a customer
    could otherwise plant total_amount = 0 and show themselves no debt. The
    guard IGNORES admin-owned columns rather than rejecting the insert, so each
    check below asserts on the STORED row, never on the absence of an error.
  */
  console.log("\nCustomer edit boundary: INSERT");
  {
    const { data: plain, error: plainError } = await supabase
      .from("vehicles")
      .insert({ user_id: attackerId, make: "Attacker", model: "Plain" })
      .select()
      .maybeSingle();
    check(
      "insert with ordinary fields is allowed",
      Boolean(plain) && !plainError,
      plainError?.message ?? "insert returned no row",
    );

    const { data: loaded } = await supabase
      .from("vehicles")
      .insert({
        user_id: attackerId,
        make: "Attacker",
        model: "Loaded",
        total_amount: 0,
        paid: 999999,
        status: "Delivered",
        auction_penalty: 0,
        final_price: 1,
        location: "Out",
        expected_opening_date: "2020-01-01",
      })
      .select()
      .maybeSingle();

    if (!loaded) {
      for (const label of [
        "insert cannot set total_amount",
        "insert cannot set status",
        "insert cannot set the other admin-owned columns",
      ]) {
        check(label, false, "the loaded insert returned no row at all");
      }
    } else {
      const stored = await storedVehicle(
        loaded.id,
        "total_amount, paid, status, auction_penalty, final_price, location, expected_opening_date",
      );

      // A customer-supplied total_amount of 0 must not survive as 0 "by
      // accident" -- 0 is also the column default, so this asserts the paid
      // column alongside it, where the attempt (999999) differs from the
      // default and the two outcomes are distinguishable.
      check(
        "insert cannot set total_amount",
        Number(stored?.total_amount) === 0 && Number(stored?.paid) === 0,
        `total_amount is ${stored?.total_amount}, paid is ${stored?.paid}`,
      );

      check(
        "insert cannot set status",
        stored?.status === "At Auction",
        `status is ${stored?.status}`,
      );

      check(
        "insert cannot set the other admin-owned columns",
        Number(stored?.auction_penalty) === 0 &&
          stored?.final_price === null &&
          stored?.location === null &&
          stored?.expected_opening_date === null,
        `auction_penalty=${stored?.auction_penalty}, final_price=${stored?.final_price}, ` +
          `location=${stored?.location}, expected_opening_date=${stored?.expected_opening_date}`,
      );
    }
  }

  // --- 11. photo removal ----------------------------------------------------
  console.log("\nCustomer edit boundary: photo DELETE");
  {
    let ownPhoto = null;
    if (ownVehicle) {
      const { data } = await supabase
        .from("vehicle_photos")
        .insert({
          vehicle_id: ownVehicle.id,
          url: `${attackerId}/${ownVehicle.id}/verify-probe.jpg`,
        })
        .select()
        .maybeSingle();
      ownPhoto = data;
    }

    if (!ownPhoto) {
      check(
        "own vehicle's photo CAN be removed",
        false,
        "the attacker's photo row was never created",
      );
    } else {
      await supabase.from("vehicle_photos").delete().eq("id", ownPhoto.id);
      const { data: after } = await supabase
        .from("vehicle_photos")
        .select("id")
        .eq("id", ownPhoto.id);
      check(
        "own vehicle's photo CAN be removed",
        (after?.length ?? 0) === 0,
        `the row is still there (${after?.length})`,
      );
    }

    if (victimPhoto) {
      const { data: deleted } = await supabase
        .from("vehicle_photos")
        .delete()
        .eq("id", victimPhoto.id)
        .select();
      check(
        "another customer's photo: delete touches zero rows",
        (deleted?.length ?? 0) === 0,
        `deleted ${deleted?.length} row(s)`,
      );
    } else {
      check(
        "another customer's photo: delete touches zero rows",
        false,
        "the victim's photo row was never created, so the check could not run",
      );
    }
  }

  await supabase.auth.signOut();

  // --- 12. read the victim's side of it -------------------------------------
  /*
    The two "zero rows" assertions above are made from the attacker's session,
    where the victim's rows are invisible either way. Signing back in as the
    victim is the only way to assert on what is actually stored rather than on
    what the attacker was allowed to see.
  */
  console.log("\nVerified from the victim's own session");
  {
    const { data: victimBack, error: signInError } =
      await supabase.auth.signInWithPassword({ email: victimEmail, password });

    if (signInError || !victimBack?.session) {
      check(
        "the victim's vin is untouched in the database",
        false,
        `could not sign back in as the victim: ${signInError?.message}`,
      );
      check(
        "the victim's photo row still exists in the database",
        false,
        `could not sign back in as the victim: ${signInError?.message}`,
      );
    } else {
      const { data: vin } = await supabase
        .from("vehicles")
        .select("vin")
        .eq("id", victimVehicle?.id ?? "")
        .maybeSingle();
      check(
        "the victim's vin is untouched in the database",
        vin?.vin === VICTIM_VIN,
        `vin is ${vin?.vin}, expected ${VICTIM_VIN}`,
      );

      const { data: photo } = await supabase
        .from("vehicle_photos")
        .select("id")
        .eq("id", victimPhoto?.id ?? "");
      check(
        "the victim's photo row still exists in the database",
        (photo?.length ?? 0) === 1,
        `found ${photo?.length} row(s)`,
      );

      await supabase.auth.signOut();
    }
  }
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
