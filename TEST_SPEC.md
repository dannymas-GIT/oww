# TEST_SPEC — CMS blog, visual templates, WW360 handoff

Branch: `feature/oww-cms-blog-ww360`

## Scope

- Template CMS with media, live canvas editor, layout wireframe previews
- Blog posts (`blog_post`) with public `/ny/blog` list and detail
- Utility-admin self-registration + complimentary membership
- WW360 entitlement / handoff integration hooks
- Jenny (`platform_admin`) Pages & blog admin UX + template tour

## Manual checks (staging)

1. Sign in as `jenny` → Administration → **Pages & blog**
2. Landing pages list shows layout thumbnails; hover opens larger sample
3. **New page** → template cards with thumbnails + when-to-use; create Home/Pathway/Story/Simple
4. Editor shows public-layout canvas; reorder sections; publish; **View live** matches canvas
5. Blog tab → new post → author/tags/excerpt → publish → `/ny/blog` and `/ny/blog/{slug}`
6. Template tour FAB / **Template tour** button on `/admin/cms`
7. `/register/utility` creates utility_admin + membership; Hiring nav / WW360 entry on employer dashboard when entitlement configured

## API smoke

```bash
curl -sS http://127.0.0.1:8003/health
curl -sS http://127.0.0.1:8003/api/v1/public/blog/ny
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8083/ny/blog
```

## Out of scope this branch

- AquaSafe Phase B IdP handoff
- Renaming WW360 `district_admin` / Super Admin label
