SELECT 
  u.id, 
  u.email, 
  COUNT(t.id) as track_count,
  CASE 
    WHEN amt.expires_at > strftime('%s', 'now') THEN 'valid'
    WHEN amt.expires_at IS NOT NULL THEN 'expired'
    ELSE 'none'
  END as apple_music_token
FROM users u 
LEFT JOIN tracks t ON u.id = t.user_id 
LEFT JOIN apple_music_tokens amt ON u.id = amt.user_id
GROUP BY u.id 
ORDER BY track_count DESC
LIMIT 100;
