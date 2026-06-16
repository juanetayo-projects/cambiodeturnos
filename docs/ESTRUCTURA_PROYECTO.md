# Estructura del Proyecto

**Ruta del código fuente:** `C:\Users\Juan Carlos Etayo\cambiodeturnos`

```
cambiodeturnos/
├── public/
│   ├── logo.png                 # Logo azul (fondo claro / exportaciones)
│   └── logo-blanco.png          # Logo blanco (login / sidebar)
├── src/
│   ├── components/
│   │   ├── Badge.tsx            # Etiqueta de estado (colores)
│   │   ├── Layout.tsx          # Sidebar + topbar + menú usuario
│   │   ├── MetricCard.tsx      # Card de métrica con sombra/relieve
│   │   └── ProtectedRoute.tsx  # Guard de rutas por rol
│   ├── contexts/
│   │   └── AuthContext.tsx     # Sesión, perfil, login/registro/recuperación
│   ├── lib/
│   │   ├── config.ts           # URLs y claves públicas
│   │   ├── supabase.ts         # Cliente Supabase
│   │   └── useCatalogos.ts     # Hook de catálogos
│   ├── pages/
│   │   ├── Login.tsx           # Inicio de sesión (diseño institucional)
│   │   ├── Register.tsx        # Registro de personal asistencial
│   │   ├── ForgotPassword.tsx  # Solicitud de recuperación
│   │   ├── ResetPassword.tsx   # Nueva contraseña
│   │   ├── Dashboard.tsx       # Métricas y gráficos (tipo Odoo)
│   │   ├── SolicitudForm.tsx   # Formulario de solicitud (1 pantalla)
│   │   ├── Solicitudes.tsx     # Tabla CRUD + filtros + exportación
│   │   ├── Reportes.tsx        # Reportes y exportación Excel/PDF
│   │   ├── Usuarios.tsx        # Gestión de usuarios (admin)
│   │   └── Catalogos.tsx       # CRUD de catálogos (admin)
│   ├── types/index.ts          # Tipos TypeScript
│   ├── utils/
│   │   ├── exporta.ts          # Exportación Excel/PDF con logo
│   │   └── format.ts           # Formato de fechas / colores
│   ├── App.tsx                 # Router
│   ├── main.tsx                # Punto de entrada
│   ├── index.css               # Estilos base + Tailwind
│   └── vite-env.d.ts
├── supabase/
│   ├── migrations/             # 0001..0006 (esquema, RLS, seeds, stats)
│   └── functions/notificar/    # Edge Function de correos (Resend)
├── scripts/
│   └── importar_historico.mjs  # Importación del histórico (CSV → Supabase)
├── docs/
│   ├── data/                   # Exports CSV de las hojas DATA y CORREOS
│   ├── SUPER_PROMPT.md
│   ├── ESTRUCTURA_PROYECTO.md
│   ├── BASE_DE_DATOS.md
│   ├── DESPLIEGUE.md
│   └── MANUAL_USUARIO.md
├── .github/workflows/deploy.yml
├── index.html
├── vite.config.ts · tailwind.config.js · postcss.config.js
├── tsconfig.json · package.json
└── README.md
```

## Convenciones
- **Rutas (HashRouter):** `/login`, `/register`, `/forgot-password`, `/reset-password`,
  `/dashboard`, `/solicitar`, `/solicitudes`, `/reportes`, `/usuarios`, `/catalogos`.
- **Tema:** colores `clinica.*` definidos en `tailwind.config.js`.
- **Datos:** todo acceso pasa por `supabase` (RLS aplica por rol).
