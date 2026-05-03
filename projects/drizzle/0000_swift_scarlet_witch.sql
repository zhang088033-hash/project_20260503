CREATE TABLE "brainstorms" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(100) NOT NULL,
	"content" text NOT NULL,
	"category" varchar(50) DEFAULT 'general' NOT NULL,
	"parent_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health_check" (
	"id" serial NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" varchar(1000),
	"priority" varchar(10) DEFAULT 'P1' NOT NULL,
	"module" varchar(50) NOT NULL,
	"deadline" timestamp with time zone,
	"deliverables" varchar(500),
	"responsible_person" varchar(100),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"remark" varchar(1000),
	"created_by" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(100) NOT NULL,
	"password_hash" text NOT NULL,
	"display_name" varchar(100),
	"role" varchar(20) DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE INDEX "brainstorms_username_idx" ON "brainstorms" USING btree ("username");--> statement-breakpoint
CREATE INDEX "brainstorms_category_idx" ON "brainstorms" USING btree ("category");--> statement-breakpoint
CREATE INDEX "brainstorms_parent_id_idx" ON "brainstorms" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "tasks_priority_idx" ON "tasks" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "tasks_module_idx" ON "tasks" USING btree ("module");--> statement-breakpoint
CREATE INDEX "tasks_status_idx" ON "tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tasks_deadline_idx" ON "tasks" USING btree ("deadline");--> statement-breakpoint
CREATE INDEX "users_username_idx" ON "users" USING btree ("username");