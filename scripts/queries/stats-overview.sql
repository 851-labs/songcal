SELECT 
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM apple_music_tokens WHERE expires_at > strftime('%s', 'now')) as users_with_valid_apple_music_token,
  (SELECT COUNT(*) FROM tracks) as total_tracks;
