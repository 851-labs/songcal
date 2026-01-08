PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_tracks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`track_id` text NOT NULL,
	`name` text NOT NULL,
	`artist_name` text NOT NULL,
	`album_name` text NOT NULL,
	`artwork_url` text,
	`duration_ms` integer NOT NULL,
	`data` text,
	`played_at` integer NOT NULL,
	`synced_to_calendar` integer DEFAULT false NOT NULL,
	`calendar_event_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_tracks`("id", "user_id", "track_id", "name", "artist_name", "album_name", "artwork_url", "duration_ms", "data", "played_at", "synced_to_calendar", "calendar_event_id", "created_at", "updated_at") SELECT "id", "user_id", "track_id", "name", "artist_name", "album_name", "artwork_url", "duration_ms", "data", "played_at", "synced_to_calendar", "calendar_event_id", "created_at", "updated_at" FROM `tracks`;--> statement-breakpoint
DROP TABLE `tracks`;--> statement-breakpoint
ALTER TABLE `__new_tracks` RENAME TO `tracks`;--> statement-breakpoint
PRAGMA foreign_keys=ON;