/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as _lib_auth from "../_lib/auth.js";
import type * as _lib_authorize from "../_lib/authorize.js";
import type * as _lib_automation from "../_lib/automation.js";
import type * as _lib_balances from "../_lib/balances.js";
import type * as _lib_debtRequests from "../_lib/debtRequests.js";
import type * as _lib_invites from "../_lib/invites.js";
import type * as _lib_money from "../_lib/money.js";
import type * as _lib_notifications from "../_lib/notifications.js";
import type * as _lib_personal from "../_lib/personal.js";
import type * as _lib_reminderSettings from "../_lib/reminderSettings.js";
import type * as _lib_spending from "../_lib/spending.js";
import type * as activity from "../activity.js";
import type * as balances from "../balances.js";
import type * as contacts from "../contacts.js";
import type * as dashboard from "../dashboard.js";
import type * as debtRequests from "../debtRequests.js";
import type * as email from "../email.js";
import type * as expenses from "../expenses.js";
import type * as groupInvites from "../groupInvites.js";
import type * as groups from "../groups.js";
import type * as inngest from "../inngest.js";
import type * as inngestBridge from "../inngestBridge.js";
import type * as notifications from "../notifications.js";
import type * as seed from "../seed.js";
import type * as seedTest from "../seedTest.js";
import type * as settings from "../settings.js";
import type * as settlements from "../settlements.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "_lib/auth": typeof _lib_auth;
  "_lib/authorize": typeof _lib_authorize;
  "_lib/automation": typeof _lib_automation;
  "_lib/balances": typeof _lib_balances;
  "_lib/debtRequests": typeof _lib_debtRequests;
  "_lib/invites": typeof _lib_invites;
  "_lib/money": typeof _lib_money;
  "_lib/notifications": typeof _lib_notifications;
  "_lib/personal": typeof _lib_personal;
  "_lib/reminderSettings": typeof _lib_reminderSettings;
  "_lib/spending": typeof _lib_spending;
  activity: typeof activity;
  balances: typeof balances;
  contacts: typeof contacts;
  dashboard: typeof dashboard;
  debtRequests: typeof debtRequests;
  email: typeof email;
  expenses: typeof expenses;
  groupInvites: typeof groupInvites;
  groups: typeof groups;
  inngest: typeof inngest;
  inngestBridge: typeof inngestBridge;
  notifications: typeof notifications;
  seed: typeof seed;
  seedTest: typeof seedTest;
  settings: typeof settings;
  settlements: typeof settlements;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
