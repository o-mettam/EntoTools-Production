# Feature flags: from first tester to general availability

Every new user-facing feature ships behind a flag. You turn it on for named users first, release it to everyone from the admin portal, and then remove the flag from the code.

## How a flag is evaluated

Each flag has a **status**. You change it in the admin portal under Feature Flags → *flag* → Status.

| Status     | Who sees the feature                                   |
|------------|--------------------------------------------------------|
| `targeted` | Only users assigned the flag. This is the default.     |
| `ga`       | Everyone, including signed-out visitors.               |
| `off`      | Nobody, including assigned users. Use it as a kill switch. |

`GET /api/account/flags` returns every `ga` flag. For a signed-in visitor it also returns their own `targeted` assignments. `public/account.js` loads the result into `window.EntoFlags` on every page, whether or not the visitor is signed in, and fires `entoflags:updated`. If anything fails, the list comes back empty, so an error can hide a feature but never reveal one.

User assignments survive every status change. Moving a flag from `ga` or `off` back to `targeted` restores the original tester list. Every status change is written to the audit log as `flag_status`.

## 1. Build the feature behind a flag

1. **Pick a key** in kebab-case that names the feature, for example `pest-phenology`.
2. **Seed the flag** with a new migration, so admins can pick it from a list instead of typing the key:
   ```sql
   -- migrations/00NN_seed_pest_phenology_flag.sql
   INSERT INTO feature_flags (flag_key, description, created_at)
   VALUES ('pest-phenology', 'Pest phenology models on the Degree Day Calculator', datetime('now'))
   ON CONFLICT(flag_key) DO NOTHING;
   ```
3. **Gate the feature in the page.** Hide its markup by default and reveal it only when the flag is present. If the feature loads extra scripts, load them only after the check, so visitors without the flag never download them. Follow the `gdrive-sync` pattern in `templates/collection_database.html`:
   ```js
   document.addEventListener('entoflags:updated', () => {
       if (!window.EntoFlags || !window.EntoFlags.has('pest-phenology')) return;
       document.getElementById('pest-phenology').classList.remove('hidden');
       // init / load scripts once
   });
   ```
   Flags are only for showing or hiding a feature. They are not access control. A server endpoint that only flagged users may call must check the flag on the server as well, using `db.getEffectiveFlags`.
4. **Check the code against the migrations** with `npm run flag-report`. It reports any key used in code that no migration seeds.

## 2. Release to testers (`targeted`)

1. Apply the migration (`wrangler d1 execute entotools-accounts --remote --file=migrations/00NN_….sql`), then deploy.
2. In the admin portal, open the flag and assign testers. Alternatively, tick the flag on a user's detail page.
3. If something goes wrong, unassign the testers or set the flag to `off`. Neither needs a deploy.

## 3. Promote to general availability (`ga`)

Do this when the testers are happy:

1. In the admin portal, open the flag, set Status to **GA**, and click Apply. It takes effect on each visitor's next page load.
2. If there's a problem, set it back to `targeted`, which restores the testers, or to `off`. Neither needs a deploy.

## 4. Remove the flag (cleanup release)

There is no soak period. As soon as a flag is GA and you're satisfied, remove it:

1. Run `npm run flag-report -- --remote`. It lists every GA flag still checked in code, with file and line numbers.
2. Delete each `EntoFlags.has('key')` check so the feature is always on. Remove the default `hidden` class too, along with any `entoflags:updated` listener that only existed for this flag.
3. Add a migration that deletes the flag. Delete the assignments first, because D1 doesn't enforce the foreign key:
   ```sql
   -- migrations/00NN_retire_pest_phenology_flag.sql
   DELETE FROM user_feature_flags WHERE flag_key = 'pest-phenology';
   DELETE FROM feature_flags WHERE flag_key = 'pest-phenology';
   ```
4. Update the user-facing pages that describe the feature. Flagged features are deliberately left out of `templates/documentation.html` until GA. If the feature contacts a new third party, also update `templates/privacy_policy.html`.
5. Deploy the code **first**, then apply the migration. In the other order, the feature disappears for everyone between the two steps.
6. Run `npm run flag-report -- --remote` again. It should report nothing to clean up.

## Deploying the lifecycle itself (one time)

Apply `migrations/0008_flag_status.sql` **before** deploying the code that reads the `status` column. Existing flags become `targeted`, which is the same behaviour as before. If the code is deployed first, the flags query fails and returns an empty list, which hides `gdrive-sync` from its testers until the migration is applied.

## Current flags

| Key | Feature | GA notes |
|---|---|---|
| `gdrive-sync` | Google Drive backup on Sample Collection and Collection Database | |
| `collection-map` | Map of saved records on Collection Database, with date and taxon filters | Opening the map loads Leaflet from jsDelivr and map tiles from tile.openstreetmap.org, which reveals the viewed area to OpenStreetMap. Add OpenStreetMap to the privacy policy at GA. The CSP allowance is per route, in `src/lib/csp.js` (`ROUTE_EXTRAS`). |
| `season-normals` | Season vs. 1991–2020 normal and last year on the Degree Day Calculator, backed by `POST /api/normals` | The endpoint checks the flag on the server (`hasFlag` in `src/routes/flags.js`). Remove that check at GA along with the client check. |
| `share-links` | Copy Link on the Degree Day Calculator. The search state is stored in the URL fragment (`#s=…`). | Opening a shared link requires the flag too. Until GA, someone without it who opens a link gets a blank calculator. |
| `station-override` | Use a specific NCEI station ID, or pick from the other nearby stations, on the Degree Day Calculator (issue #40). `/api/search` honours `station_id` only for flagged users (`hasFlag`). | Remove the server check in `handleSearch` along with the client check. Add the station picker to `templates/documentation.html` at GA. |
