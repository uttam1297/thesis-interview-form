-- Local development seed. Never run against production.
--
-- Only study data lives here. The researcher account is created through the
-- Auth admin API (`npm run db:seed-researcher`) rather than by writing
-- auth.users directly, which GoTrue rejects.

insert into studies (slug, title)
values ('thesis-2026', 'From Data to Product Decisions: AI-Assisted Product Analytics')
on conflict (slug) do nothing;
