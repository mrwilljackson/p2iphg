-- archive-seed-event.sql
--
-- Test fixture for the event archive process.
--
-- Seeds TWO events:
--
--   Event A — Manchester Arena Powerhouse Games 2026   (status = 'completed')
--     The archive target. After archiving, every row for this event in
--     registrations, organisation_contacts, and volunteers MUST be deleted.
--
--   Event B — Liverpool Anfield Powerhouse Games 2026  (status = 'active')
--     An untouched control event. After Event A is archived, every row for
--     Event B in those tables MUST still be present.
--
-- One organisation — "Salford Community Hub" — is shared between BOTH events
-- via two separate organisation_contacts rows. This verifies the global
-- organisations row survives Event A's archive (the RESTRICT FK from
-- organisation_contacts.organisation_id holds it in place via Event B).
--
-- Prerequisite:
--     npm run db:clear    (or otherwise start from an empty DB)
--
-- Apply with one of:
--     psql "$DATABASE_URL" -f scripts/archive-seed-event.sql
--     npx tsx scripts/run-sql.ts scripts/archive-seed-event.sql
--
-- After applying, run the SELECT block at the bottom of this file to confirm
-- the seed loaded correctly.

BEGIN;

-- ============================================================
-- EVENTS
-- ============================================================
INSERT INTO events (id, name, date, location, description, status, airtable_record_id, created_at, modified_at) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Manchester Arena Powerhouse Games 2026',  '2026-03-15', 'Manchester Arena, Manchester', 'Spring 2026 inclusive sports day', 'completed', 'recABC123XYZ', now(), now()),
  ('a0000000-0000-0000-0000-000000000002', 'Liverpool Anfield Powerhouse Games 2026', '2026-06-14', 'Anfield Stadium, Liverpool',   'Summer 2026 inclusive sports day', 'active',    'recDEF456ABC', now(), now());


-- ============================================================
-- ORGANISATIONS (global records — must survive Event A archive)
-- ============================================================
INSERT INTO organisations (id, name, group_type, airtable_record_id, created_at, modified_at) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Royal Lancashire Disability Network', 'Disability',  'recORG001', now(), now()),
  ('b0000000-0000-0000-0000-000000000002', 'St Helens Family Centre',             'Family',      'recORG002', now(), now()),
  ('b0000000-0000-0000-0000-000000000003', 'Greater Manchester Cadets',           'Corporate',   'recORG003', now(), now()),
  ('b0000000-0000-0000-0000-000000000004', 'Wrexham Wheelchair Basketball',       'Sporting',    'recORG004', now(), now()),
  ('b0000000-0000-0000-0000-000000000005', 'Manchester College SEN',              'Educational', 'recORG005', now(), now()),
  ('b0000000-0000-0000-0000-000000000006', 'Salford Community Hub',               'Community',   'recORG006', now(), now()),
  ('b0000000-0000-0000-0000-000000000007', 'Liverpool Disability Association',    'Disability',  'recORG007', now(), now());


-- ============================================================
-- ORGANISATION CONTACTS — Event A (6 rows)
-- ============================================================
INSERT INTO organisation_contacts (
  id, organisation_id, event_id, open_group,
  photo_consent, feedback_consent, next_event_consent,
  contact_first_name, contact_last_name, contact_email, contact_phone,
  expected_group_size, airtable_record_id, created_at, modified_at
) VALUES
  ('c0000000-0000-0000-0000-0000000000a1', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', true,  true, true,  true,  'Eleanor', 'Whitfield', 'eleanor.whitfield@rldn.example.org',  '07700 900101', '10', 'recCON101', now(), now()),
  ('c0000000-0000-0000-0000-0000000000a2', 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', true,  true, true,  true,  'James',   'Henderson', 'james.henderson@shfc.example.org',    '07700 900102', '14', 'recCON102', now(), now()),
  ('c0000000-0000-0000-0000-0000000000a3', 'b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', false, true, true,  true,  'Stephen', 'Marsh',     'stephen.marsh@gmcadets.example.org',  '07700 900103', '30', 'recCON103', now(), now()),
  ('c0000000-0000-0000-0000-0000000000a4', 'b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', false, true, true,  false, 'Owen',    'Davies',    'owen.davies@wwb.example.org',         '07700 900104', '18', 'recCON104', now(), now()),
  ('c0000000-0000-0000-0000-0000000000a5', 'b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', true,  true, true,  true,  'Priya',   'Sharma',    'priya.sharma@mcsen.example.org',      '07700 900105', '25', 'recCON105', now(), now()),
  ('c0000000-0000-0000-0000-0000000000a6', 'b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', true,  true, true,  true,  'Hannah',  'Roberts',   'hannah.roberts@sch.example.org',      '07700 900106', '8',  'recCON106', now(), now());


-- ============================================================
-- ORGANISATION CONTACTS — Event B (2 rows)
-- Salford Community Hub appears in BOTH events (shared org).
-- ============================================================
INSERT INTO organisation_contacts (
  id, organisation_id, event_id, open_group,
  photo_consent, feedback_consent, next_event_consent,
  contact_first_name, contact_last_name, contact_email, contact_phone,
  expected_group_size, airtable_record_id, created_at, modified_at
) VALUES
  ('c0000000-0000-0000-0000-0000000000b1', 'b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000002', true, true, true,  true, 'Hannah', 'Roberts', 'hannah.roberts@sch.example.org', '07700 900106', '10', 'recCON201', now(), now()),
  ('c0000000-0000-0000-0000-0000000000b2', 'b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000002', true, true, false, true, 'Daniel', 'Murphy',  'daniel.murphy@lda.example.org',  '07700 900107', '12', 'recCON202', now(), now());


-- ============================================================
-- VOLUNTEERS — Event A (25 rows)
-- ============================================================
INSERT INTO volunteers (id, event_id, email, first_name, last_name, photo_consent, feedback_consent, next_event_consent, airtable_record_id, created_at, modified_at) VALUES
  ('d0000000-0000-0000-0000-0000000000a1', 'a0000000-0000-0000-0000-000000000001', 'sophie.adams@example.com',     'Sophie',   'Adams',     true, true,  true,  'recVOLA001', now(), now()),
  ('d0000000-0000-0000-0000-0000000000a2', 'a0000000-0000-0000-0000-000000000001', 'ben.brown@example.com',        'Ben',      'Brown',     true, true,  true,  'recVOLA002', now(), now()),
  ('d0000000-0000-0000-0000-0000000000a3', 'a0000000-0000-0000-0000-000000000001', 'maya.chen@example.com',        'Maya',     'Chen',      true, false, true,  'recVOLA003', now(), now()),
  ('d0000000-0000-0000-0000-0000000000a4', 'a0000000-0000-0000-0000-000000000001', 'tom.davies@example.com',       'Tom',      'Davies',    true, true,  false, 'recVOLA004', now(), now()),
  ('d0000000-0000-0000-0000-0000000000a5', 'a0000000-0000-0000-0000-000000000001', 'aisha.edwards@example.com',    'Aisha',    'Edwards',   true, true,  true,  'recVOLA005', now(), now()),
  ('d0000000-0000-0000-0000-0000000000a6', 'a0000000-0000-0000-0000-000000000001', 'liam.fisher@example.com',      'Liam',     'Fisher',    true, false, true,  'recVOLA006', now(), now()),
  ('d0000000-0000-0000-0000-0000000000a7', 'a0000000-0000-0000-0000-000000000001', 'chloe.green@example.com',      'Chloe',    'Green',     true, true,  true,  'recVOLA007', now(), now()),
  ('d0000000-0000-0000-0000-0000000000a8', 'a0000000-0000-0000-0000-000000000001', 'ethan.harris@example.com',     'Ethan',    'Harris',    true, true,  false, 'recVOLA008', now(), now()),
  ('d0000000-0000-0000-0000-0000000000a9', 'a0000000-0000-0000-0000-000000000001', 'zara.iqbal@example.com',       'Zara',     'Iqbal',     true, true,  true,  'recVOLA009', now(), now()),
  ('d0000000-0000-0000-0000-0000000000aa', 'a0000000-0000-0000-0000-000000000001', 'noah.jones@example.com',       'Noah',     'Jones',     true, true,  true,  'recVOLA010', now(), now()),
  ('d0000000-0000-0000-0000-0000000000ab', 'a0000000-0000-0000-0000-000000000001', 'lily.king@example.com',        'Lily',     'King',      true, false, false, 'recVOLA011', now(), now()),
  ('d0000000-0000-0000-0000-0000000000ac', 'a0000000-0000-0000-0000-000000000001', 'oscar.lewis@example.com',      'Oscar',    'Lewis',     true, true,  true,  'recVOLA012', now(), now()),
  ('d0000000-0000-0000-0000-0000000000ad', 'a0000000-0000-0000-0000-000000000001', 'grace.mitchell@example.com',   'Grace',    'Mitchell',  true, true,  true,  'recVOLA013', now(), now()),
  ('d0000000-0000-0000-0000-0000000000ae', 'a0000000-0000-0000-0000-000000000001', 'finn.nash@example.com',        'Finn',     'Nash',      true, true,  false, 'recVOLA014', now(), now()),
  ('d0000000-0000-0000-0000-0000000000af', 'a0000000-0000-0000-0000-000000000001', 'ivy.owen@example.com',         'Ivy',      'Owen',      true, true,  true,  'recVOLA015', now(), now()),
  ('d0000000-0000-0000-0000-000000000a10', 'a0000000-0000-0000-0000-000000000001', 'leo.patel@example.com',        'Leo',      'Patel',     true, false, true,  'recVOLA016', now(), now()),
  ('d0000000-0000-0000-0000-000000000a11', 'a0000000-0000-0000-0000-000000000001', 'ruby.quinn@example.com',       'Ruby',     'Quinn',     true, true,  true,  'recVOLA017', now(), now()),
  ('d0000000-0000-0000-0000-000000000a12', 'a0000000-0000-0000-0000-000000000001', 'jack.roberts@example.com',     'Jack',     'Roberts',   true, true,  true,  'recVOLA018', now(), now()),
  ('d0000000-0000-0000-0000-000000000a13', 'a0000000-0000-0000-0000-000000000001', 'mia.singh@example.com',        'Mia',      'Singh',     true, true,  false, 'recVOLA019', now(), now()),
  ('d0000000-0000-0000-0000-000000000a14', 'a0000000-0000-0000-0000-000000000001', 'henry.taylor@example.com',     'Henry',    'Taylor',    true, true,  true,  'recVOLA020', now(), now()),
  ('d0000000-0000-0000-0000-000000000a15', 'a0000000-0000-0000-0000-000000000001', 'amelia.underwood@example.com', 'Amelia',   'Underwood', true, false, false, 'recVOLA021', now(), now()),
  ('d0000000-0000-0000-0000-000000000a16', 'a0000000-0000-0000-0000-000000000001', 'charlie.vincent@example.com',  'Charlie',  'Vincent',   true, true,  true,  'recVOLA022', now(), now()),
  ('d0000000-0000-0000-0000-000000000a17', 'a0000000-0000-0000-0000-000000000001', 'olivia.walsh@example.com',     'Olivia',   'Walsh',     true, true,  true,  'recVOLA023', now(), now()),
  ('d0000000-0000-0000-0000-000000000a18', 'a0000000-0000-0000-0000-000000000001', 'george.yates@example.com',     'George',   'Yates',     true, true,  false, 'recVOLA024', now(), now()),
  ('d0000000-0000-0000-0000-000000000a19', 'a0000000-0000-0000-0000-000000000001', 'florence.zhang@example.com',   'Florence', 'Zhang',     true, true,  true,  'recVOLA025', now(), now());


-- ============================================================
-- VOLUNTEERS — Event B (5 rows)
-- ============================================================
INSERT INTO volunteers (id, event_id, email, first_name, last_name, photo_consent, feedback_consent, next_event_consent, airtable_record_id, created_at, modified_at) VALUES
  ('d0000000-0000-0000-0000-0000000000b1', 'a0000000-0000-0000-0000-000000000002', 'arthur.bell@example.com',   'Arthur',  'Bell',     true, true,  true,  'recVOLB001', now(), now()),
  ('d0000000-0000-0000-0000-0000000000b2', 'a0000000-0000-0000-0000-000000000002', 'isla.campbell@example.com', 'Isla',    'Campbell', true, true,  true,  'recVOLB002', now(), now()),
  ('d0000000-0000-0000-0000-0000000000b3', 'a0000000-0000-0000-0000-000000000002', 'reuben.dixon@example.com',  'Reuben',  'Dixon',    true, false, true,  'recVOLB003', now(), now()),
  ('d0000000-0000-0000-0000-0000000000b4', 'a0000000-0000-0000-0000-000000000002', 'matilda.ellis@example.com', 'Matilda', 'Ellis',    true, true,  false, 'recVOLB004', now(), now()),
  ('d0000000-0000-0000-0000-0000000000b5', 'a0000000-0000-0000-0000-000000000002', 'arlo.foster@example.com',   'Arlo',    'Foster',   true, true,  true,  'recVOLB005', now(), now());


-- ============================================================
-- REGISTRATIONS — Event A — PARTICIPANTS (49 rows)
-- ============================================================

-- Org 1: Royal Lancashire Disability Network (open, 8 partics: 6 impaired, 2 non-impaired)
INSERT INTO registrations (id, event_id, attendee_name, attendee_surname, email, organization_id, impairment, role, photo_consent, feedback_consent, next_event_consent, organisation_name, created_at, modified_at) VALUES
  ('e0000000-0000-0000-1001-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Alex',   'Carr',   'alex.carr@example.com',     'b0000000-0000-0000-0000-000000000001', 'wheelchair user',   'Participant', true,  true,  true,  'Royal Lancashire Disability Network', now(), now()),
  ('e0000000-0000-0000-1001-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Bryony', 'Hall',   'bryony.hall@example.com',   'b0000000-0000-0000-0000-000000000001', 'visually impaired', 'Participant', true,  true,  true,  'Royal Lancashire Disability Network', now(), now()),
  ('e0000000-0000-0000-1001-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Conor',  'Hughes', 'conor.hughes@example.com',  'b0000000-0000-0000-0000-000000000001', 'wheelchair user',   'Participant', true,  false, true,  'Royal Lancashire Disability Network', now(), now()),
  ('e0000000-0000-0000-1001-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Della',  'Frost',  'della.frost@example.com',   'b0000000-0000-0000-0000-000000000001', 'hearing impaired',  'Participant', true,  true,  true,  'Royal Lancashire Disability Network', now(), now()),
  ('e0000000-0000-0000-1001-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Ewan',   'Bell',   'ewan.bell@example.com',     'b0000000-0000-0000-0000-000000000001', 'wheelchair user',   'Participant', false, true,  false, 'Royal Lancashire Disability Network', now(), now()),
  ('e0000000-0000-0000-1001-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Fiona',  'Gray',   'fiona.gray@example.com',    'b0000000-0000-0000-0000-000000000001', 'amputee',           'Participant', true,  false, true,  'Royal Lancashire Disability Network', now(), now()),
  ('e0000000-0000-0000-1001-000000000007', 'a0000000-0000-0000-0000-000000000001', 'Gareth', 'Price',  'gareth.price@example.com',  'b0000000-0000-0000-0000-000000000001', NULL,                'Participant', true,  true,  true,  'Royal Lancashire Disability Network', now(), now()),
  ('e0000000-0000-0000-1001-000000000008', 'a0000000-0000-0000-0000-000000000001', 'Hattie', 'Owen',   'hattie.owen@example.com',   'b0000000-0000-0000-0000-000000000001', NULL,                'Participant', true,  false, true,  'Royal Lancashire Disability Network', now(), now());

-- Org 2: St Helens Family Centre (open, 14 partics: 5 impaired, 9 non-impaired)
INSERT INTO registrations (id, event_id, attendee_name, attendee_surname, email, organization_id, impairment, role, photo_consent, feedback_consent, next_event_consent, organisation_name, created_at, modified_at) VALUES
  ('e0000000-0000-0000-1002-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Isaac',  'Murphy', 'isaac.murphy@example.com', 'b0000000-0000-0000-0000-000000000002', 'autistic',          'Participant', true,  true,  true,  'St Helens Family Centre', now(), now()),
  ('e0000000-0000-0000-1002-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Jasmin', 'Reid',   'jasmin.reid@example.com',  'b0000000-0000-0000-0000-000000000002', 'autistic',          'Participant', true,  true,  false, 'St Helens Family Centre', now(), now()),
  ('e0000000-0000-0000-1002-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Kai',    'Stone',  'kai.stone@example.com',    'b0000000-0000-0000-0000-000000000002', 'learning disabled', 'Participant', true,  false, true,  'St Helens Family Centre', now(), now()),
  ('e0000000-0000-0000-1002-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Layla',  'Watts',  'layla.watts@example.com',  'b0000000-0000-0000-0000-000000000002', 'learning disabled', 'Participant', true,  true,  true,  'St Helens Family Centre', now(), now()),
  ('e0000000-0000-0000-1002-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Marcus', 'Young',  'marcus.young@example.com', 'b0000000-0000-0000-0000-000000000002', 'wheelchair user',   'Participant', true,  true,  true,  'St Helens Family Centre', now(), now()),
  ('e0000000-0000-0000-1002-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Niamh',  'Ashby',  'niamh.ashby@example.com',  'b0000000-0000-0000-0000-000000000002', NULL,                'Participant', true,  false, true,  'St Helens Family Centre', now(), now()),
  ('e0000000-0000-0000-1002-000000000007', 'a0000000-0000-0000-0000-000000000001', 'Otis',   'Booth',  'otis.booth@example.com',   'b0000000-0000-0000-0000-000000000002', NULL,                'Participant', true,  true,  false, 'St Helens Family Centre', now(), now()),
  ('e0000000-0000-0000-1002-000000000008', 'a0000000-0000-0000-0000-000000000001', 'Pippa',  'Coates', 'pippa.coates@example.com', 'b0000000-0000-0000-0000-000000000002', NULL,                'Participant', true,  true,  true,  'St Helens Family Centre', now(), now()),
  ('e0000000-0000-0000-1002-000000000009', 'a0000000-0000-0000-0000-000000000001', 'Quinn',  'Dean',   'quinn.dean@example.com',   'b0000000-0000-0000-0000-000000000002', NULL,                'Participant', true,  false, true,  'St Helens Family Centre', now(), now()),
  ('e0000000-0000-0000-1002-000000000010', 'a0000000-0000-0000-0000-000000000001', 'Rosa',   'Ellis',  'rosa.ellis@example.com',   'b0000000-0000-0000-0000-000000000002', NULL,                'Participant', true,  true,  true,  'St Helens Family Centre', now(), now()),
  ('e0000000-0000-0000-1002-000000000011', 'a0000000-0000-0000-0000-000000000001', 'Sam',    'Foster', 'sam.foster@example.com',   'b0000000-0000-0000-0000-000000000002', NULL,                'Participant', true,  true,  false, 'St Helens Family Centre', now(), now()),
  ('e0000000-0000-0000-1002-000000000012', 'a0000000-0000-0000-0000-000000000001', 'Tia',    'Greene', 'tia.greene@example.com',   'b0000000-0000-0000-0000-000000000002', NULL,                'Participant', true,  true,  true,  'St Helens Family Centre', now(), now()),
  ('e0000000-0000-0000-1002-000000000013', 'a0000000-0000-0000-0000-000000000001', 'Umar',   'Holt',   'umar.holt@example.com',    'b0000000-0000-0000-0000-000000000002', NULL,                'Participant', true,  false, false, 'St Helens Family Centre', now(), now()),
  ('e0000000-0000-0000-1002-000000000014', 'a0000000-0000-0000-0000-000000000001', 'Vera',   'Irwin',  'vera.irwin@example.com',   'b0000000-0000-0000-0000-000000000002', NULL,                'Participant', true,  true,  true,  'St Helens Family Centre', now(), now());

-- Org 5: Manchester College SEN (open, 22 partics: 18 impaired, 4 non-impaired)
INSERT INTO registrations (id, event_id, attendee_name, attendee_surname, email, organization_id, impairment, role, photo_consent, feedback_consent, next_event_consent, organisation_name, created_at, modified_at) VALUES
  ('e0000000-0000-0000-1005-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Wendy',    'Adams',   'wendy.adams@example.com',    'b0000000-0000-0000-0000-000000000005', 'learning disabled', 'Participant', true,  true,  true,  'Manchester College SEN', now(), now()),
  ('e0000000-0000-0000-1005-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Xavier',   'Booth',   'xavier.booth@example.com',   'b0000000-0000-0000-0000-000000000005', 'autistic',          'Participant', true,  true,  true,  'Manchester College SEN', now(), now()),
  ('e0000000-0000-0000-1005-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Yusuf',    'Clarke',  'yusuf.clarke@example.com',   'b0000000-0000-0000-0000-000000000005', 'autistic',          'Participant', true,  false, true,  'Manchester College SEN', now(), now()),
  ('e0000000-0000-0000-1005-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Zoe',      'Drake',   'zoe.drake@example.com',      'b0000000-0000-0000-0000-000000000005', 'learning disabled', 'Participant', true,  true,  true,  'Manchester College SEN', now(), now()),
  ('e0000000-0000-0000-1005-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Adam',     'Edwards', 'adam.edwards@example.com',   'b0000000-0000-0000-0000-000000000005', 'autistic',          'Participant', true,  true,  true,  'Manchester College SEN', now(), now()),
  ('e0000000-0000-0000-1005-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Bea',      'Floyd',   'bea.floyd@example.com',      'b0000000-0000-0000-0000-000000000005', 'cerebral palsy',    'Participant', true,  true,  true,  'Manchester College SEN', now(), now()),
  ('e0000000-0000-0000-1005-000000000007', 'a0000000-0000-0000-0000-000000000001', 'Cyril',    'Gray',    'cyril.gray@example.com',     'b0000000-0000-0000-0000-000000000005', 'autistic',          'Participant', true,  false, true,  'Manchester College SEN', now(), now()),
  ('e0000000-0000-0000-1005-000000000008', 'a0000000-0000-0000-0000-000000000001', 'Dora',     'Hicks',   'dora.hicks@example.com',     'b0000000-0000-0000-0000-000000000005', 'learning disabled', 'Participant', true,  true,  false, 'Manchester College SEN', now(), now()),
  ('e0000000-0000-0000-1005-000000000009', 'a0000000-0000-0000-0000-000000000001', 'Eli',      'Jones',   'eli.jones@example.com',      'b0000000-0000-0000-0000-000000000005', 'autistic',          'Participant', true,  true,  true,  'Manchester College SEN', now(), now()),
  ('e0000000-0000-0000-1005-000000000010', 'a0000000-0000-0000-0000-000000000001', 'Faye',     'Knight',  'faye.knight@example.com',    'b0000000-0000-0000-0000-000000000005', 'autistic',          'Participant', true,  true,  true,  'Manchester College SEN', now(), now()),
  ('e0000000-0000-0000-1005-000000000011', 'a0000000-0000-0000-0000-000000000001', 'Greg',     'Lake',    'greg.lake@example.com',      'b0000000-0000-0000-0000-000000000005', 'learning disabled', 'Participant', true,  false, true,  'Manchester College SEN', now(), now()),
  ('e0000000-0000-0000-1005-000000000012', 'a0000000-0000-0000-0000-000000000001', 'Harper',   'Marsh',   'harper.marsh@example.com',   'b0000000-0000-0000-0000-000000000005', 'cerebral palsy',    'Participant', true,  true,  true,  'Manchester College SEN', now(), now()),
  ('e0000000-0000-0000-1005-000000000013', 'a0000000-0000-0000-0000-000000000001', 'Idris',    'Nash',    'idris.nash@example.com',     'b0000000-0000-0000-0000-000000000005', 'autistic',          'Participant', true,  true,  false, 'Manchester College SEN', now(), now()),
  ('e0000000-0000-0000-1005-000000000014', 'a0000000-0000-0000-0000-000000000001', 'Jade',     'Oakley',  'jade.oakley@example.com',    'b0000000-0000-0000-0000-000000000005', 'autistic',          'Participant', true,  true,  true,  'Manchester College SEN', now(), now()),
  ('e0000000-0000-0000-1005-000000000015', 'a0000000-0000-0000-0000-000000000001', 'Kit',      'Penn',    'kit.penn@example.com',       'b0000000-0000-0000-0000-000000000005', 'autistic',          'Participant', true,  true,  true,  'Manchester College SEN', now(), now()),
  ('e0000000-0000-0000-1005-000000000016', 'a0000000-0000-0000-0000-000000000001', 'Luna',     'Quaid',   'luna.quaid@example.com',     'b0000000-0000-0000-0000-000000000005', 'learning disabled', 'Participant', true,  false, true,  'Manchester College SEN', now(), now()),
  ('e0000000-0000-0000-1005-000000000017', 'a0000000-0000-0000-0000-000000000001', 'Milo',     'Ramsey',  'milo.ramsey@example.com',    'b0000000-0000-0000-0000-000000000005', 'autistic',          'Participant', true,  true,  true,  'Manchester College SEN', now(), now()),
  ('e0000000-0000-0000-1005-000000000018', 'a0000000-0000-0000-0000-000000000001', 'Nia',      'Sands',   'nia.sands@example.com',      'b0000000-0000-0000-0000-000000000005', 'autistic',          'Participant', true,  true,  true,  'Manchester College SEN', now(), now()),
  ('e0000000-0000-0000-1005-000000000019', 'a0000000-0000-0000-0000-000000000001', 'Otis',     'Trent',   'otis.trent@example.com',     'b0000000-0000-0000-0000-000000000005', NULL,                'Participant', true,  true,  false, 'Manchester College SEN', now(), now()),
  ('e0000000-0000-0000-1005-000000000020', 'a0000000-0000-0000-0000-000000000001', 'Penny',    'Unwin',   'penny.unwin@example.com',    'b0000000-0000-0000-0000-000000000005', NULL,                'Participant', true,  true,  true,  'Manchester College SEN', now(), now()),
  ('e0000000-0000-0000-1005-000000000021', 'a0000000-0000-0000-0000-000000000001', 'Quentin',  'Voss',    'quentin.voss@example.com',   'b0000000-0000-0000-0000-000000000005', NULL,                'Participant', true,  false, true,  'Manchester College SEN', now(), now()),
  ('e0000000-0000-0000-1005-000000000022', 'a0000000-0000-0000-0000-000000000001', 'Ronnie',   'Wade',    'ronnie.wade@example.com',    'b0000000-0000-0000-0000-000000000005', NULL,                'Participant', true,  true,  true,  'Manchester College SEN', now(), now());

-- Org 6: Salford Community Hub (open, 5 partics: 1 impaired, 4 non-impaired)
INSERT INTO registrations (id, event_id, attendee_name, attendee_surname, email, organization_id, impairment, role, photo_consent, feedback_consent, next_event_consent, organisation_name, created_at, modified_at) VALUES
  ('e0000000-0000-0000-1006-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Sebastian', 'Yates',  'sebastian.yates@example.com', 'b0000000-0000-0000-0000-000000000006', 'wheelchair user', 'Participant', true, true,  true,  'Salford Community Hub', now(), now()),
  ('e0000000-0000-0000-1006-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Tara',      'Zane',   'tara.zane@example.com',       'b0000000-0000-0000-0000-000000000006', NULL,              'Participant', true, false, true,  'Salford Community Hub', now(), now()),
  ('e0000000-0000-0000-1006-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Ursula',    'Avery',  'ursula.avery@example.com',    'b0000000-0000-0000-0000-000000000006', NULL,              'Participant', true, true,  true,  'Salford Community Hub', now(), now()),
  ('e0000000-0000-0000-1006-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Vincent',   'Beck',   'vincent.beck@example.com',    'b0000000-0000-0000-0000-000000000006', NULL,              'Participant', true, true,  false, 'Salford Community Hub', now(), now()),
  ('e0000000-0000-0000-1006-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Willow',    'Cane',   'willow.cane@example.com',     'b0000000-0000-0000-0000-000000000006', NULL,              'Participant', true, true,  true,  'Salford Community Hub', now(), now());


-- ============================================================
-- REGISTRATIONS — Event A — GROUP LEADERS (6 rows, role='Group')
-- For closed groups, the leader's row is the ONLY registration for that org
-- (members don't register individually). group_size / impaired_participants /
-- non_impaired_participants on these rows are what feed the closed-group counts.
-- ============================================================
INSERT INTO registrations (
  id, event_id, attendee_name, attendee_surname, email, organization_id, role,
  photo_consent, feedback_consent, next_event_consent,
  group_size, impaired_participants, non_impaired_participants, group_leader_participating,
  organisation_name, created_at, modified_at
) VALUES
  ('e0000000-0000-0000-9000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Eleanor', 'Whitfield', 'eleanor.whitfield@rldn.example.org',  'b0000000-0000-0000-0000-000000000001', 'Group', true, true, true,  10,  6,  2, false, 'Royal Lancashire Disability Network', now(), now()),
  ('e0000000-0000-0000-9000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'James',   'Henderson', 'james.henderson@shfc.example.org',    'b0000000-0000-0000-0000-000000000002', 'Group', true, true, true,  14,  5,  9, true,  'St Helens Family Centre', now(), now()),
  ('e0000000-0000-0000-9000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Stephen', 'Marsh',     'stephen.marsh@gmcadets.example.org',  'b0000000-0000-0000-0000-000000000003', 'Group', true, true, true,  30,  0, 30, true,  'Greater Manchester Cadets', now(), now()),
  ('e0000000-0000-0000-9000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Owen',    'Davies',    'owen.davies@wwb.example.org',         'b0000000-0000-0000-0000-000000000004', 'Group', true, true, false, 18, 16,  2, false, 'Wrexham Wheelchair Basketball', now(), now()),
  ('e0000000-0000-0000-9000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Priya',   'Sharma',    'priya.sharma@mcsen.example.org',      'b0000000-0000-0000-0000-000000000005', 'Group', true, true, true,  22, 18,  4, false, 'Manchester College SEN', now(), now()),
  ('e0000000-0000-0000-9000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Hannah',  'Roberts',   'hannah.roberts@sch.example.org',      'b0000000-0000-0000-0000-000000000006', 'Group', true, true, true,   5,  1,  4, true,  'Salford Community Hub', now(), now());


-- ============================================================
-- REGISTRATIONS — Event A — HELPERS (25 rows, role='Volunteer')
-- Created when a pre-registered volunteer checks in on the day.
-- ============================================================
INSERT INTO registrations (id, event_id, attendee_name, attendee_surname, email, role, photo_consent, feedback_consent, next_event_consent, created_at, modified_at) VALUES
  ('e0000000-0000-0000-8000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Sophie',   'Adams',     'sophie.adams@example.com',     'Volunteer', true, true,  true,  now(), now()),
  ('e0000000-0000-0000-8000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Ben',      'Brown',     'ben.brown@example.com',        'Volunteer', true, true,  true,  now(), now()),
  ('e0000000-0000-0000-8000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Maya',     'Chen',      'maya.chen@example.com',        'Volunteer', true, false, true,  now(), now()),
  ('e0000000-0000-0000-8000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Tom',      'Davies',    'tom.davies@example.com',       'Volunteer', true, true,  false, now(), now()),
  ('e0000000-0000-0000-8000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Aisha',    'Edwards',   'aisha.edwards@example.com',    'Volunteer', true, true,  true,  now(), now()),
  ('e0000000-0000-0000-8000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Liam',     'Fisher',    'liam.fisher@example.com',      'Volunteer', true, false, true,  now(), now()),
  ('e0000000-0000-0000-8000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'Chloe',    'Green',     'chloe.green@example.com',      'Volunteer', true, true,  true,  now(), now()),
  ('e0000000-0000-0000-8000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'Ethan',    'Harris',    'ethan.harris@example.com',     'Volunteer', true, true,  false, now(), now()),
  ('e0000000-0000-0000-8000-000000000009', 'a0000000-0000-0000-0000-000000000001', 'Zara',     'Iqbal',     'zara.iqbal@example.com',       'Volunteer', true, true,  true,  now(), now()),
  ('e0000000-0000-0000-8000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'Noah',     'Jones',     'noah.jones@example.com',       'Volunteer', true, true,  true,  now(), now()),
  ('e0000000-0000-0000-8000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'Lily',     'King',      'lily.king@example.com',        'Volunteer', true, false, false, now(), now()),
  ('e0000000-0000-0000-8000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'Oscar',    'Lewis',     'oscar.lewis@example.com',      'Volunteer', true, true,  true,  now(), now()),
  ('e0000000-0000-0000-8000-000000000013', 'a0000000-0000-0000-0000-000000000001', 'Grace',    'Mitchell',  'grace.mitchell@example.com',   'Volunteer', true, true,  true,  now(), now()),
  ('e0000000-0000-0000-8000-000000000014', 'a0000000-0000-0000-0000-000000000001', 'Finn',     'Nash',      'finn.nash@example.com',        'Volunteer', true, true,  false, now(), now()),
  ('e0000000-0000-0000-8000-000000000015', 'a0000000-0000-0000-0000-000000000001', 'Ivy',      'Owen',      'ivy.owen@example.com',         'Volunteer', true, true,  true,  now(), now()),
  ('e0000000-0000-0000-8000-000000000016', 'a0000000-0000-0000-0000-000000000001', 'Leo',      'Patel',     'leo.patel@example.com',        'Volunteer', true, false, true,  now(), now()),
  ('e0000000-0000-0000-8000-000000000017', 'a0000000-0000-0000-0000-000000000001', 'Ruby',     'Quinn',     'ruby.quinn@example.com',       'Volunteer', true, true,  true,  now(), now()),
  ('e0000000-0000-0000-8000-000000000018', 'a0000000-0000-0000-0000-000000000001', 'Jack',     'Roberts',   'jack.roberts@example.com',     'Volunteer', true, true,  true,  now(), now()),
  ('e0000000-0000-0000-8000-000000000019', 'a0000000-0000-0000-0000-000000000001', 'Mia',      'Singh',     'mia.singh@example.com',        'Volunteer', true, true,  false, now(), now()),
  ('e0000000-0000-0000-8000-000000000020', 'a0000000-0000-0000-0000-000000000001', 'Henry',    'Taylor',    'henry.taylor@example.com',     'Volunteer', true, true,  true,  now(), now()),
  ('e0000000-0000-0000-8000-000000000021', 'a0000000-0000-0000-0000-000000000001', 'Amelia',   'Underwood', 'amelia.underwood@example.com', 'Volunteer', true, false, false, now(), now()),
  ('e0000000-0000-0000-8000-000000000022', 'a0000000-0000-0000-0000-000000000001', 'Charlie',  'Vincent',   'charlie.vincent@example.com',  'Volunteer', true, true,  true,  now(), now()),
  ('e0000000-0000-0000-8000-000000000023', 'a0000000-0000-0000-0000-000000000001', 'Olivia',   'Walsh',     'olivia.walsh@example.com',     'Volunteer', true, true,  true,  now(), now()),
  ('e0000000-0000-0000-8000-000000000024', 'a0000000-0000-0000-0000-000000000001', 'George',   'Yates',     'george.yates@example.com',     'Volunteer', true, true,  false, now(), now()),
  ('e0000000-0000-0000-8000-000000000025', 'a0000000-0000-0000-0000-000000000001', 'Florence', 'Zhang',     'florence.zhang@example.com',   'Volunteer', true, true,  true,  now(), now());


-- ============================================================
-- REGISTRATIONS — Event B (control event — must remain after Event A archive)
-- 7 participants + 2 group leaders + 5 helpers = 14 rows
-- ============================================================

-- Event B: Liverpool Disability Association (open, 4 partics: 3 impaired, 1 non-impaired)
INSERT INTO registrations (id, event_id, attendee_name, attendee_surname, email, organization_id, impairment, role, photo_consent, feedback_consent, next_event_consent, organisation_name, created_at, modified_at) VALUES
  ('e0000000-0000-0000-2007-000000000001', 'a0000000-0000-0000-0000-000000000002', 'Aaron',  'Brennan', 'aaron.brennan@example.com', 'b0000000-0000-0000-0000-000000000007', 'wheelchair user',  'Participant', true, true,  true,  'Liverpool Disability Association', now(), now()),
  ('e0000000-0000-0000-2007-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Beth',   'Carter',  'beth.carter@example.com',   'b0000000-0000-0000-0000-000000000007', 'visually impaired','Participant', true, true,  true,  'Liverpool Disability Association', now(), now()),
  ('e0000000-0000-0000-2007-000000000003', 'a0000000-0000-0000-0000-000000000002', 'Cassie', 'Doyle',   'cassie.doyle@example.com',  'b0000000-0000-0000-0000-000000000007', 'wheelchair user',  'Participant', true, false, true,  'Liverpool Disability Association', now(), now()),
  ('e0000000-0000-0000-2007-000000000004', 'a0000000-0000-0000-0000-000000000002', 'Dion',   'Evans',   'dion.evans@example.com',    'b0000000-0000-0000-0000-000000000007', NULL,               'Participant', true, true,  true,  'Liverpool Disability Association', now(), now());

-- Event B: Salford Community Hub (open, 3 partics: 1 impaired, 2 non-impaired)
INSERT INTO registrations (id, event_id, attendee_name, attendee_surname, email, organization_id, impairment, role, photo_consent, feedback_consent, next_event_consent, organisation_name, created_at, modified_at) VALUES
  ('e0000000-0000-0000-2006-000000000001', 'a0000000-0000-0000-0000-000000000002', 'Edie',  'Forbes', 'edie.forbes@example.com',  'b0000000-0000-0000-0000-000000000006', 'autistic', 'Participant', true, true, true, 'Salford Community Hub', now(), now()),
  ('e0000000-0000-0000-2006-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Felix', 'Gibson', 'felix.gibson@example.com', 'b0000000-0000-0000-0000-000000000006', NULL,       'Participant', true, true, true, 'Salford Community Hub', now(), now()),
  ('e0000000-0000-0000-2006-000000000003', 'a0000000-0000-0000-0000-000000000002', 'Grace', 'Hill',   'grace.hill@example.com',   'b0000000-0000-0000-0000-000000000006', NULL,       'Participant', true, false,true, 'Salford Community Hub', now(), now());

-- Event B: Group leaders
INSERT INTO registrations (id, event_id, attendee_name, attendee_surname, email, organization_id, role, photo_consent, feedback_consent, next_event_consent, group_size, impaired_participants, non_impaired_participants, group_leader_participating, organisation_name, created_at, modified_at) VALUES
  ('e0000000-0000-0000-9100-000000000001', 'a0000000-0000-0000-0000-000000000002', 'Daniel', 'Murphy',  'daniel.murphy@lda.example.org',  'b0000000-0000-0000-0000-000000000007', 'Group', true, false, true, 4, 3, 1, true,  'Liverpool Disability Association', now(), now()),
  ('e0000000-0000-0000-9100-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Hannah', 'Roberts', 'hannah.roberts@sch.example.org', 'b0000000-0000-0000-0000-000000000006', 'Group', true, true,  true, 3, 1, 2, false, 'Salford Community Hub', now(), now());

-- Event B: Helpers
INSERT INTO registrations (id, event_id, attendee_name, attendee_surname, email, role, photo_consent, feedback_consent, next_event_consent, created_at, modified_at) VALUES
  ('e0000000-0000-0000-8100-000000000001', 'a0000000-0000-0000-0000-000000000002', 'Arthur',  'Bell',     'arthur.bell@example.com',   'Volunteer', true, true,  true,  now(), now()),
  ('e0000000-0000-0000-8100-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Isla',    'Campbell', 'isla.campbell@example.com', 'Volunteer', true, true,  true,  now(), now()),
  ('e0000000-0000-0000-8100-000000000003', 'a0000000-0000-0000-0000-000000000002', 'Reuben',  'Dixon',    'reuben.dixon@example.com',  'Volunteer', true, false, true,  now(), now()),
  ('e0000000-0000-0000-8100-000000000004', 'a0000000-0000-0000-0000-000000000002', 'Matilda', 'Ellis',    'matilda.ellis@example.com', 'Volunteer', true, true,  false, now(), now()),
  ('e0000000-0000-0000-8100-000000000005', 'a0000000-0000-0000-0000-000000000002', 'Arlo',    'Foster',   'arlo.foster@example.com',   'Volunteer', true, true,  true,  now(), now());


COMMIT;


-- ============================================================
-- POST-SEED VERIFICATION (run after applying the seed)
-- ============================================================
-- SELECT 'events'                                  AS what, count(*) AS n FROM events
-- UNION ALL SELECT 'organisations',                        count(*) FROM organisations
-- UNION ALL SELECT 'organisation_contacts (Event A)',      count(*) FROM organisation_contacts WHERE event_id = 'a0000000-0000-0000-0000-000000000001'
-- UNION ALL SELECT 'organisation_contacts (Event B)',      count(*) FROM organisation_contacts WHERE event_id = 'a0000000-0000-0000-0000-000000000002'
-- UNION ALL SELECT 'volunteers (Event A)',                 count(*) FROM volunteers            WHERE event_id = 'a0000000-0000-0000-0000-000000000001'
-- UNION ALL SELECT 'volunteers (Event B)',                 count(*) FROM volunteers            WHERE event_id = 'a0000000-0000-0000-0000-000000000002'
-- UNION ALL SELECT 'registrations Event A Participant',    count(*) FROM registrations WHERE event_id = 'a0000000-0000-0000-0000-000000000001' AND role = 'Participant'
-- UNION ALL SELECT 'registrations Event A Group',          count(*) FROM registrations WHERE event_id = 'a0000000-0000-0000-0000-000000000001' AND role = 'Group'
-- UNION ALL SELECT 'registrations Event A Volunteer',      count(*) FROM registrations WHERE event_id = 'a0000000-0000-0000-0000-000000000001' AND role = 'Volunteer'
-- UNION ALL SELECT 'registrations Event B Participant',    count(*) FROM registrations WHERE event_id = 'a0000000-0000-0000-0000-000000000002' AND role = 'Participant'
-- UNION ALL SELECT 'registrations Event B Group',          count(*) FROM registrations WHERE event_id = 'a0000000-0000-0000-0000-000000000002' AND role = 'Group'
-- UNION ALL SELECT 'registrations Event B Volunteer',      count(*) FROM registrations WHERE event_id = 'a0000000-0000-0000-0000-000000000002' AND role = 'Volunteer';
--
-- Expected results:
--   events                                  2
--   organisations                           7
--   organisation_contacts (Event A)         6
--   organisation_contacts (Event B)         2
--   volunteers (Event A)                   25
--   volunteers (Event B)                    5
--   registrations Event A Participant      49
--   registrations Event A Group             6
--   registrations Event A Volunteer        25
--   registrations Event B Participant       7
--   registrations Event B Group             2
--   registrations Event B Volunteer         5
--
-- ============================================================
-- POST-ARCHIVE VERIFICATION (run AFTER archiving Event A)
-- ============================================================
-- After running the archive flow on Event A
-- (id = 'a0000000-0000-0000-0000-000000000001'), the following must hold:
--
--   1. events                                 STILL 2  (Event A row kept, status='archived')
--   2. organisations                          STILL 7  (no orgs deleted)
--   3. organisation_contacts (Event A)        = 0
--   4. organisation_contacts (Event B)        STILL 2
--   5. volunteers (Event A)                   = 0
--   6. volunteers (Event B)                   STILL 5
--   7. registrations Event A (any role)       = 0
--   8. registrations Event B (any role)       STILL 14
--   9. event_archive                          1 row for Event A
--  10. event_archive_org_lines                6 rows for that archive
