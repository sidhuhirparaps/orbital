-- Confirm both demo Auth users (run after creating them in Authentication → Users)
update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now())
where email in ('alex@orbital.app', 'sam@orbital.app');
