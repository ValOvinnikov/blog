CREATE TYPE "public"."admin_role" AS ENUM('SUPERADMIN', 'ADMIN', 'MODERATOR');--> statement-breakpoint
CREATE TYPE "public"."granted_via" AS ENUM('BREAK_GLASS', 'PROMOTION');--> statement-breakpoint
CREATE TYPE "public"."blocked_identity_kind" AS ENUM('ADDRESS', 'DOMAIN');--> statement-breakpoint
CREATE TYPE "public"."membership_role" AS ENUM('OWNER', 'EDITOR', 'READER');--> statement-breakpoint
CREATE TYPE "public"."account_button_style" AS ENUM('PILL', 'CIRCLE');--> statement-breakpoint
CREATE TYPE "public"."account_panel_style" AS ENUM('CARD', 'PROFILE', 'HUB');--> statement-breakpoint
CREATE TYPE "public"."account_phone_placement" AS ENUM('BAR', 'MENU');--> statement-breakpoint
CREATE TYPE "public"."busy_button_style" AS ENUM('LABEL', 'KEPT', 'EDGE');--> statement-breakpoint
CREATE TYPE "public"."card_style" AS ENUM('ACCENT_BAR', 'OUTLINED');--> statement-breakpoint
CREATE TYPE "public"."cookie_settings_button" AS ENUM('HIDDEN', 'SHOWN');--> statement-breakpoint
CREATE TYPE "public"."density" AS ENUM('DEFAULT', 'COMPACT');--> statement-breakpoint
CREATE TYPE "public"."font_choice" AS ENUM('SPACE_GROTESK', 'NEWSREADER', 'JETBRAINS_MONO', 'FRAUNCES', 'INTER');--> statement-breakpoint
CREATE TYPE "public"."footer_background" AS ENUM('PRIMARY', 'SECONDARY', 'BRAND_PRIMARY');--> statement-breakpoint
CREATE TYPE "public"."footer_layout" AS ENUM('COLUMNS', 'CENTRED', 'COMPACT', 'BIG_WORDMARK');--> statement-breakpoint
CREATE TYPE "public"."footer_surface" AS ENUM('FULL_WIDTH', 'CARD');--> statement-breakpoint
CREATE TYPE "public"."header_bar_style" AS ENUM('FULL_WIDTH', 'FLOATING');--> statement-breakpoint
CREATE TYPE "public"."header_control_style" AS ENUM('OUTLINED', 'SOFT', 'PLAIN');--> statement-breakpoint
CREATE TYPE "public"."header_layout" AS ENUM('CLASSIC', 'LINKS_BESIDE_BRAND', 'CENTRED_LINKS', 'TWO_ROWS', 'CENTRED_BRAND', 'MENU_BUTTON');--> statement-breakpoint
CREATE TYPE "public"."header_submenu_style" AS ENUM('DROPDOWN', 'WIDE_PANEL');--> statement-breakpoint
CREATE TYPE "public"."language_switcher_style" AS ENUM('MENU_CODE', 'MENU_GLOBE', 'CODES');--> statement-breakpoint
CREATE TYPE "public"."preset_id" AS ENUM('CONSOLE', 'EDITORIAL');--> statement-breakpoint
CREATE TYPE "public"."radius_scale" AS ENUM('SM', 'MD', 'LG', 'XL');--> statement-breakpoint
CREATE TYPE "public"."spinner_style" AS ENUM('PRESET', 'BRAILLE', 'RING', 'DOTS', 'PULSE');--> statement-breakpoint
CREATE TYPE "public"."locale_code" AS ENUM('EN', 'NL', 'FR', 'DE', 'ES');--> statement-breakpoint
CREATE TYPE "public"."site_type" AS ENUM('BLOG', 'PORTFOLIO', 'PERSONAL', 'DOCS', 'BLANK', 'BUSINESS', 'PRODUCT');--> statement-breakpoint
CREATE TYPE "public"."tenant_plan" AS ENUM('FREE', 'GROWTH');--> statement-breakpoint
CREATE TYPE "public"."tenant_status" AS ENUM('ACTIVE', 'SUSPENDED', 'ARCHIVED');--> statement-breakpoint
CREATE TABLE "admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"role" "admin_role" NOT NULL,
	"granted_by" text,
	"granted_via" "granted_via" NOT NULL,
	"granted_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admins_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" text NOT NULL,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"details" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL,
	"app" text DEFAULT 'SITE' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"nameEncrypted" text,
	"emailEncrypted" text,
	"emailIndex" text,
	"emailVerified" timestamp,
	"image" text,
	"termsAcceptedAt" timestamp,
	"termsVersion" text,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "blocked_signup_identities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "blocked_identity_kind" NOT NULL,
	"value" text NOT NULL,
	"reason" text NOT NULL,
	"created_by_admin_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blocked_signup_identities_kind_value_unique" UNIQUE("kind","value")
);
--> statement-breakpoint
CREATE TABLE "bookmarks" (
	"tenant_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"post_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bookmarks_tenant_id_user_id_post_id_pk" PRIMARY KEY("tenant_id","user_id","post_id")
);
--> statement-breakpoint
CREATE TABLE "custom_domain_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"domain" text NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "custom_domain_claims_tenant_id_unique" UNIQUE("tenant_id")
);
--> statement-breakpoint
CREATE TABLE "email_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"logo_asset_url" text,
	"sender_name" text,
	"reply_to_address" text,
	"footer_postal_address" text,
	"contact_recipient" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_config_tenant_id_unique" UNIQUE("tenant_id")
);
--> statement-breakpoint
CREATE TABLE "email_template_logos" (
	"tenant_id" uuid NOT NULL,
	"template_type" text NOT NULL,
	"logo_asset_url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_template_logos_tenant_id_template_type_pk" PRIMARY KEY("tenant_id","template_type")
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"tenant_id" uuid NOT NULL,
	"template_type" text NOT NULL,
	"locale" "locale_code" NOT NULL,
	"subject" text,
	"body" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_templates_tenant_id_template_type_locale_pk" PRIMARY KEY("tenant_id","template_type","locale")
);
--> statement-breakpoint
CREATE TABLE "findings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"source" text NOT NULL,
	"kind" text NOT NULL,
	"severity" text NOT NULL,
	"status" text NOT NULL,
	"dedupe_key" text NOT NULL,
	"details" jsonb,
	"first_seen_at" timestamp DEFAULT now() NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name_encrypted" text NOT NULL,
	"email_encrypted" text NOT NULL,
	"email_index" text NOT NULL,
	"message_encrypted" text NOT NULL,
	"source_path" text NOT NULL,
	"source_document_id" text,
	"source_locale" text,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "magic_link_send_counters" (
	"key" text PRIMARY KEY NOT NULL,
	"window_started_at" timestamp NOT NULL,
	"count" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "membership_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email_encrypted" text NOT NULL,
	"email_index" text NOT NULL,
	"email_exact_index" text,
	"role" "membership_role" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"consumed_at" timestamp,
	CONSTRAINT "membership_invites_tenant_id_email_exact_index_unique" UNIQUE("tenant_id","email_exact_index")
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"tenant_id" uuid NOT NULL,
	"role" "membership_role" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "memberships_user_id_tenant_id_unique" UNIQUE("user_id","tenant_id")
);
--> statement-breakpoint
CREATE TABLE "settings_features" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"comments_enabled" boolean DEFAULT true NOT NULL,
	"ratings_enabled" boolean DEFAULT true NOT NULL,
	"bookmarks_enabled" boolean DEFAULT true NOT NULL,
	"newsletter_enabled" boolean DEFAULT false NOT NULL,
	"analytics_enabled" boolean DEFAULT false NOT NULL,
	"consent_banner_enabled" boolean DEFAULT false NOT NULL,
	"contact_form_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "settings_features_tenant_id_unique" UNIQUE("tenant_id")
);
--> statement-breakpoint
CREATE TABLE "site_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"preset" "preset_id" NOT NULL,
	"accent_hue" integer NOT NULL,
	"logo_hue" integer,
	"heading_font" "font_choice" NOT NULL,
	"body_font" "font_choice" NOT NULL,
	"radius_scale" "radius_scale" NOT NULL,
	"density" "density" NOT NULL,
	"language_switcher_style" "language_switcher_style" DEFAULT 'MENU_CODE' NOT NULL,
	"card_style" "card_style" DEFAULT 'ACCENT_BAR' NOT NULL,
	"header_control_style" "header_control_style" DEFAULT 'OUTLINED' NOT NULL,
	"account_button_style" "account_button_style" DEFAULT 'PILL' NOT NULL,
	"account_panel_style" "account_panel_style" DEFAULT 'CARD' NOT NULL,
	"account_phone_placement" "account_phone_placement" DEFAULT 'BAR' NOT NULL,
	"busy_button_style" "busy_button_style" DEFAULT 'LABEL' NOT NULL,
	"spinner_style" "spinner_style" DEFAULT 'PRESET' NOT NULL,
	"header_layout" "header_layout" DEFAULT 'CLASSIC' NOT NULL,
	"header_submenu_style" "header_submenu_style" DEFAULT 'DROPDOWN' NOT NULL,
	"header_bar_style" "header_bar_style" DEFAULT 'FULL_WIDTH' NOT NULL,
	"footer_layout" "footer_layout" DEFAULT 'COLUMNS' NOT NULL,
	"footer_background" "footer_background" DEFAULT 'BRAND_PRIMARY' NOT NULL,
	"footer_surface" "footer_surface" DEFAULT 'FULL_WIDTH' NOT NULL,
	"cookie_settings_button" "cookie_settings_button" DEFAULT 'HIDDEN' NOT NULL,
	"logo_asset_url" text,
	"favicon_asset_url" text,
	"voice_overrides" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "site_config_tenant_id_unique" UNIQUE("tenant_id")
);
--> statement-breakpoint
CREATE TABLE "subscribers" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email_encrypted" text NOT NULL,
	"email_index" text NOT NULL,
	"email_exact_index" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"confirmation_token_hash" text NOT NULL,
	"unsubscribe_token_hash" text NOT NULL,
	"subscribed_at" timestamp DEFAULT now() NOT NULL,
	"confirmed_at" timestamp,
	"confirmation_sent_at" timestamp,
	CONSTRAINT "subscribers_confirmation_token_hash_unique" UNIQUE("confirmation_token_hash"),
	CONSTRAINT "subscribers_unsubscribe_token_hash_unique" UNIQUE("unsubscribe_token_hash"),
	CONSTRAINT "subscribers_tenant_id_email_exact_index_unique" UNIQUE("tenant_id","email_exact_index")
);
--> statement-breakpoint
CREATE TABLE "tenant_domains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"domain" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_domains_domain_unique" UNIQUE("domain")
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"primary_domain" text NOT NULL,
	"sanity_project_id" text,
	"sanity_dataset" text,
	"sanity_read_token_encrypted" text,
	"sanity_write_token_encrypted" text,
	"sanity_management_token_encrypted" text,
	"revalidate_webhook_secret_encrypted" text,
	"locale" "locale_code" NOT NULL,
	"additional_locales" "locale_code"[] DEFAULT '{}' NOT NULL,
	"plan" "tenant_plan" NOT NULL,
	"status" "tenant_status" NOT NULL,
	"provisioning_status" text,
	"provisioning_steps" jsonb,
	"last_notified_owner_elevation_outcome" text,
	"seeded_at" timestamp,
	"webhook_created_at" timestamp,
	"deprovisioned_at" timestamp,
	"deprovisioning_steps" jsonb,
	"site_type" "site_type",
	"site_template_version" integer,
	"self_serve_owner_email_index" text,
	"owner_sanity_invite_id" text,
	"owner_invite_sent_at" timestamp,
	"owner_invite_accepted_at" timestamp,
	"owner_sanity_user_id" text,
	"owner_login_provider" text,
	"owner_sanity_role" text,
	"owner_invite_heads_up_sent_at" timestamp,
	"owner_invite_nudge_sent_at" timestamp,
	"owner_site_ready_sent_at" timestamp,
	"unsent_reinvite_former_owner_email_encrypted" text,
	"last_activity_at" timestamp DEFAULT now() NOT NULL,
	"inactivity_warned_at" timestamp,
	"suspended_at" timestamp,
	"deletion_notified_at" timestamp,
	"suspension_reason" text,
	"content_migration_failed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_sanity_project_id_unique" UNIQUE("sanity_project_id")
);
--> statement-breakpoint
ALTER TABLE "admins" ADD CONSTRAINT "admins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admins" ADD CONSTRAINT "admins_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocked_signup_identities" ADD CONSTRAINT "blocked_signup_identities_created_by_admin_id_admins_id_fk" FOREIGN KEY ("created_by_admin_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_domain_claims" ADD CONSTRAINT "custom_domain_claims_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_config" ADD CONSTRAINT "email_config_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_template_logos" ADD CONSTRAINT "email_template_logos_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "findings" ADD CONSTRAINT "findings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_invites" ADD CONSTRAINT "membership_invites_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings_features" ADD CONSTRAINT "settings_features_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_config" ADD CONSTRAINT "site_config_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscribers" ADD CONSTRAINT "subscribers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_domains" ADD CONSTRAINT "tenant_domains_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_events_target_idx" ON "audit_events" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_index_idx" ON "users" USING btree ("emailIndex");--> statement-breakpoint
CREATE INDEX "findings_tenant_idx" ON "findings" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "findings_status_idx" ON "findings" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "findings_open_dedupe_key_idx" ON "findings" USING btree ("dedupe_key") WHERE "findings"."status" = 'OPEN';--> statement-breakpoint
CREATE INDEX "leads_tenant_created_at_idx" ON "leads" USING btree ("tenant_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "membership_invites_email_index_idx" ON "membership_invites" USING btree ("email_index");--> statement-breakpoint
CREATE INDEX "subscribers_tenant_email_index_idx" ON "subscribers" USING btree ("tenant_id","email_index");--> statement-breakpoint
CREATE UNIQUE INDEX "tenants_self_serve_free_owner_idx" ON "tenants" USING btree ("self_serve_owner_email_index") WHERE "tenants"."plan" = 'FREE' and "tenants"."status" <> 'ARCHIVED';