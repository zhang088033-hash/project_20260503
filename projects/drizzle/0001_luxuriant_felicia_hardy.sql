ALTER TABLE "brainstorms" ADD COLUMN "task_id" integer;--> statement-breakpoint
ALTER TABLE "brainstorms" ADD COLUMN "is_ai" boolean DEFAULT false;--> statement-breakpoint
CREATE INDEX "brainstorms_task_id_idx" ON "brainstorms" USING btree ("task_id");