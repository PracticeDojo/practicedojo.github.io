# Setting up sign-in (Discord and Google)

One-time setup for Phase 3 accounts (Feature 42). Everything happens in three dashboards: Supabase,
Discord and Google Cloud. **Client secrets only ever go into the Supabase dashboard**; never into the
repo, chat or the app.

The one URL you need in both Discord and Google is the Supabase callback:

```
https://wztyzqxkdwtrzassykdq.supabase.co/auth/v1/callback
```

(You can also copy it from Supabase → Authentication → Sign In / Providers → Discord or Google.)

---

## 0. Supabase URL settings (once)

1. Supabase dashboard → your project → **Authentication** (left sidebar) → **URL Configuration**.
2. **Site URL:** `https://practicedojo.github.io` → **Save**.
3. **Redirect URLs** → **Add URL**, add both:
   - `https://practicedojo.github.io/**`
   - `http://localhost:*/**` (only for local testing)
4. **Save**.

Without this, the provider sends people back to the wrong page after signing in.

---

## 1. Discord

**In Discord** (https://discord.com/developers/applications, log in with your Discord account):

1. Click **New Application** (top right). Name it `Practice Dojo`, tick the terms, click **Create**.
2. Optional, on **General Information**: add an app icon and short description. Players see these on
   Discord's "Authorize" screen.
3. Left sidebar → **OAuth2**.
4. Under **Redirects** → **Add Redirect** → paste the Supabase callback URL above.
5. Click **Save Changes** (the bar at the bottom of the page).
6. On the same page, under **Client information**:
   - Copy the **Client ID**.
   - Click **Reset Secret** (confirm; Discord may ask for your 2FA code), then copy the **Client Secret**.
     It's shown once, so paste it straight into Supabase in the next step.

You don't need a bot, extra scopes or anything under "Installation". Supabase asks Discord for name,
avatar and email itself.

**In Supabase:**

7. **Authentication** → **Sign In / Providers** → expand **Discord**.
8. Turn **Discord Enabled** on, paste the **Client ID** and **Client Secret**, click **Save**.

---

## 2. Google

**In Google Cloud** (https://console.cloud.google.com, log in with the Google account that should own it):

1. **Create a project:** top bar project picker → **New Project** → name `Practice Dojo` → **Create**.
   Make sure it's selected in the project picker afterwards.
2. Open **Google Auth Platform** (search for it in the top search bar, or go to
   https://console.cloud.google.com/auth/overview). If it says it isn't configured yet, click **Get started**:
   - **App information:** App name `Practice Dojo`, User support email = your email.
   - **Audience:** **External**.
   - **Contact information:** your email.
   - Tick the agreement, click **Create**.
3. **Branding** (left menu):
   - App logo (optional), **Application home page** `https://practicedojo.github.io`.
   - **Authorized domains** → **Add domain**: `practicedojo.github.io`, then `supabase.co`.
   - **Save**.
4. **Data Access** (left menu) → **Add or remove scopes** → tick `.../auth/userinfo.email`,
   `.../auth/userinfo.profile` and `openid` → **Update** → **Save**. These basic scopes don't need Google's review.
5. **Clients** (left menu) → **Create client**:
   - **Application type:** Web application. Name: `Practice Dojo web`.
   - **Authorized JavaScript origins** → **Add URI** → `https://practicedojo.github.io`
   - **Authorized redirect URIs** → **Add URI** → the Supabase callback URL above.
   - Click **Create**. Copy the **Client ID** and **Client secret** from the dialog (or download the JSON).
     Newer consoles only show the secret here, so copy it now.
6. **Audience** (left menu) → **Publishing status: Testing** → **Publish app** → **Confirm**.
   While it stays in *Testing*, only Google accounts you list under *Test users* can sign in.

**In Supabase:**

7. **Authentication** → **Sign In / Providers** → expand **Google**.
8. Turn **Enable Sign in with Google** on. Paste the **Client ID** into **Client IDs** and the secret into
   **Client Secret (for OAuth)**. Leave **Skip nonce checks** off. Click **Save**.

---

## 3. Check it

- Supabase → Authentication → Sign In / Providers lists Discord and Google as **Enabled**, and
  Anonymous sign-ins and Manual linking are still on.
- The Dojo's **Sign in** button (v2.23.0+) → *Continue with Discord* / *Continue with Google* goes to the
  provider and back, and the header shows your name.

## If something goes wrong

| What you see | Usually means |
|---|---|
| Discord: "Invalid OAuth2 redirect_uri" | The Redirects entry doesn't exactly match the Supabase callback URL (check `https`, no trailing slash) |
| Google: "Error 400: redirect_uri_mismatch" | Same, under the Google client's *Authorized redirect URIs* |
| Google: "Access blocked: app has not completed verification" or only some accounts work | The app is still in *Testing*; publish it (step 2.6) |
| Back on the Dojo but not signed in, or on the wrong page | Supabase URL Configuration (step 0) |
| "Unsupported provider: provider is not enabled" | The provider's toggle in Supabase isn't on or wasn't saved |
