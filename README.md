# React + Vite

## WhatsApp Embedded Signup

The WhatsApp setup page supports Meta Embedded Signup. Configure the Meta App ID
and WhatsApp Embedded Signup configuration ID in the frontend environment:

```env
VITE_FB_APP_ID=your_meta_app_id
VITE_WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID=your_whatsapp_configuration_id
```

The configuration ID defaults to `1122230804109701`, matching the Meta
Embedded Signup configuration for this integration. The signup popup uses
session info version `3` and flow version `v4`. Set the environment variable
when using a different configuration. The Meta App must have WhatsApp Embedded
Signup configured, and the site must meet Meta's domain and HTTPS requirements.

After the popup returns its temporary authorization code, the frontend sends it
to `POST /api/whats/embedded-signup`; the Laravel API exchanges it with Meta and
saves the connected number. The authenticated API must expose this route. Never
put the Meta App Secret in frontend environment variables. Numbers connected
through Embedded Signup can use the per-number “Reconnect auto-reply” action to
call `POST /api/whats/items/{id}/resubscribe-webhook`.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
